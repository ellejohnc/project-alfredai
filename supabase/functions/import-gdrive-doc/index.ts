import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader === "Bearer undefined" || authHeader === "Bearer null") {
      return json({ error: "Unauthorized - no valid auth token" }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json({ error: "Unauthorized - missing bearer token" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;

    if (userError || !userId) {
      return json({ error: "Unauthorized: invalid or expired session" }, 401);
    }

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "editor", "super_admin"])
      .maybeSingle();
    if (!role) return json({ error: "Admin access required" }, 403);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // --- Resolve Google access token ---
    // Priority 1: User's connected Google account
    // Priority 2: Service account (fallback for shared folder)
    let googleAccessToken: string | null = null;
    let usingUserAccount = false;

    const { data: googleConn } = await supabase
      .from("user_google_connections")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (googleConn) {
      const expiresAt = new Date(googleConn.token_expires_at).getTime();
      const now = Date.now();

      if (expiresAt > now + 60_000) {
        // Token still valid
        googleAccessToken = googleConn.access_token;
        usingUserAccount = true;
      } else if (googleConn.refresh_token) {
        // Refresh the token
        const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
        const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
        if (clientId && clientSecret) {
          try {
            const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: googleConn.refresh_token,
                grant_type: "refresh_token",
              }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              googleAccessToken = refreshData.access_token;
              usingUserAccount = true;

              // Save refreshed token (and new refresh_token if Google rotated it)
              const updateData: Record<string, string> = {
                access_token: refreshData.access_token,
                token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              };
              if (refreshData.refresh_token) {
                updateData.refresh_token = refreshData.refresh_token;
              }
              await supabase
                .from("user_google_connections")
                .update(updateData)
                .eq("user_id", userId);
            } else {
              const errText = await refreshRes.text();
              console.error("Google token refresh failed:", errText);
              
              // If refresh token is revoked/invalid, mark connection as needing reconnection
              if (refreshRes.status === 400 || refreshRes.status === 401) {
                // Don't delete the connection — just return a clear signal
                if (action === "list") {
                  return json({ 
                    error: "google_reconnect_needed", 
                    message: "Your Google connection has expired. Please reconnect your Google account." 
                  }, 200);
                }
              }
            }
          } catch (e) {
            console.error("Token refresh error:", e);
          }
        }
      }
    }

    // No service account fallback — require user's connected Google account

    // Check connection status action
    if (action === "check-connection") {
      return json({
        connected: usingUserAccount,
      });
    }

    // If no user account connected, always require connection
    if (!usingUserAccount || !googleAccessToken) {
      return json({ 
        error: "no_google_connection", 
        message: "No Google account connected. Please connect your Google account in Connectors settings." 
      }, 200);
    }

    // For list action — only use user's own Drive
    if (action === "list") {
      const mimeTypes = [
        "application/vnd.google-apps.document",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain", "text/markdown", "application/pdf",
      ];
      const q = "trashed = false and (" +
        mimeTypes.map((m) => "mimeType='" + m + "'").join(" or ") + ")";
      const fields = "files(id,name,mimeType,createdTime,modifiedTime,webViewLink,thumbnailLink,iconLink)";
      const listUrl = "https://www.googleapis.com/drive/v3/files?q=" +
        encodeURIComponent(q) + "&fields=" + encodeURIComponent(fields) +
        "&orderBy=modifiedTime%20desc&pageSize=50";
      const lr = await fetch(listUrl, { headers: { Authorization: "Bearer " + googleAccessToken } });
      if (!lr.ok) {
        const rawError = await lr.text();
        console.error("User Drive list failed:", rawError);

        let parsedError: any = null;
        try {
          parsedError = JSON.parse(rawError);
        } catch {
          parsedError = null;
        }

        const activationUrl = parsedError?.error?.details?.find((d: any) => d?.metadata?.activationUrl)?.metadata?.activationUrl
          || parsedError?.error?.details?.find((d: any) => Array.isArray(d?.links))?.links?.[0]?.url;

        const serviceDisabled =
          parsedError?.error?.status === "PERMISSION_DENIED" &&
          (parsedError?.error?.details?.some((d: any) => d?.reason === "SERVICE_DISABLED") ||
            parsedError?.error?.message?.toLowerCase?.().includes("google drive api has not been used"));

        if (serviceDisabled) {
          return json({
            error: "google_drive_api_disabled",
            message: "Google Drive API is disabled for your Google OAuth app. Enable Google Drive API in Google Cloud, then retry.",
            activationUrl: activationUrl || null,
          }, 200);
        }

        if (lr.status === 401 || lr.status === 403) {
          return json({
            error: "google_reconnect_needed",
            message: "Your Google connection needs to be refreshed. Please reconnect your Google account and retry.",
          }, 200);
        }

        return json({ error: "Failed to list files from your Google Drive. Try reconnecting your Google account." }, 500);
      }
      return json({ files: (await lr.json()).files || [], source: "user_account" });
    }

    if (action === "fetch") {
      let fileId = url.searchParams.get("fileId");
      const docUrl = url.searchParams.get("url");
      if (!fileId && docUrl) {
        const match = docUrl.match(/\/(?:file|document)\/d\/([a-zA-Z0-9_-]+)/) ||
          docUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match) fileId = match[1];
      }
      if (!fileId) return json({ error: "fileId or url required" }, 400);

      let html = "";
      let text = "";
      let metaName = "";
      let metaMimeType = "";
      let fetched = false;

      // Use user's connected Google account only
      const gHeaders = { Authorization: "Bearer " + googleAccessToken };
      const metaRes = await fetch(
        "https://www.googleapis.com/drive/v3/files/" + fileId + "?fields=id,name,mimeType,thumbnailLink",
        { headers: gHeaders }
      );

      if (metaRes.ok) {
        const meta = await metaRes.json();
        metaName = meta.name || fileId;
        metaMimeType = meta.mimeType || "";

        if (meta.mimeType === "application/vnd.google-apps.document") {
          const [htmlRes, textRes] = await Promise.all([
            fetch("https://www.googleapis.com/drive/v3/files/" + fileId + "/export?mimeType=text/html", { headers: gHeaders }),
            fetch("https://www.googleapis.com/drive/v3/files/" + fileId + "/export?mimeType=text/plain", { headers: gHeaders }),
          ]);
          if (htmlRes.ok) html = await htmlRes.text();
          if (textRes.ok) text = await textRes.text();
          fetched = true;
        } else {
          const dlRes = await fetch(
            "https://www.googleapis.com/drive/v3/files/" + fileId + "?alt=media",
            { headers: gHeaders }
          );
          if (dlRes.ok) {
            text = await dlRes.text();
            fetched = true;
          }
        }
      }

      // If fetch failed, return clear error — no service account or public fallback
      if (!fetched) {
        return json({
          ok: false,
          code: 404,
          error: "Cannot access this document. Make sure it's in your Google Drive or shared with your connected Google account.",
        }, 200);
      }

      let cleaned = "";
      if (html) {
        cleaned = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<meta[^>]*>/gi, "").replace(/<link[^>]*>/gi, "");
        const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) cleaned = bodyMatch[1];
        cleaned = cleaned.replace(/\s*style="[^"]*"/gi, "")
          .replace(/<span[^>]*>\s*<\/span>/gi, "")
          .replace(/<span[^>]*>([\s\S]*?)<\/span>/gi, "$1")
          .replace(/\s*class="[^"]*"/gi, "")
          .replace(/\s*id="[^"]*"/gi, "")
          .replace(/<p>\s*<\/p>/gi, "").trim();
      }

      const imgMatch = html ? html.match(/<img[^>]+src="([^"]+)"/i) : null;
      const docName = metaName || fileId;
      const title = docName.replace(/\.[^/.]+$/, "").trim() || "Untitled";
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

      let excerpt = text.substring(0, 200).trim() + "...";
      let tags: string[] = [];
      let category = "";

      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (apiKey) {
        try {
          const aiRes = await fetch("https://api.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: 'Extract: excerpt (max 200 chars), 3-6 tags, category. JSON only: {"excerpt":"...","tags":["..."],"category":"..."}' },
                { role: "user", content: "Title: " + title + "\n\n" + text.substring(0, 4000) },
              ],
              temperature: 0.3, max_tokens: 500,
            }),
          });
          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              excerpt = parsed.excerpt || excerpt;
              tags = Array.isArray(parsed.tags) ? parsed.tags : [];
              category = parsed.category || "";
            }
          }
        } catch (_e) { /* fallback */ }
      }

      return json({
        title, slug, content: cleaned || text, excerpt, tags, category,
        featured_image_url: imgMatch ? imgMatch[1] : "",
        source: { fileId, fileName: docName, mimeType: metaMimeType },
      });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err: unknown) {
    console.error("import-gdrive-doc error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
