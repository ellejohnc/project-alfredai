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
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (userError || !userId) return json({ error: "Unauthorized" }, 401);

    // Admin check
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "editor", "super_admin"])
      .maybeSingle();
    if (!role) return json({ error: "Admin access required" }, 403);

    // Resolve Google access token
    const googleAccessToken = await resolveGoogleToken(supabase, userId);
    if (!googleAccessToken) {
      return json({ error: "no_google_connection", message: "No Google account connected." }, 200);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    if (action === "list") {
      return await listDriveImages(googleAccessToken, json);
    }

    if (action === "upload-to-storage") {
      const body = await req.json();
      const { fileId, fileName } = body;
      if (!fileId) return json({ error: "fileId required" }, 400);
      return await uploadToStorage(supabase, googleAccessToken, fileId, fileName || fileId, json);
    }

    if (action === "bulk-replace") {
      const body = await req.json();
      const { postId } = body;
      if (!postId) return json({ error: "postId required" }, 400);
      return await bulkReplaceDriveImages(supabase, googleAccessToken, postId, json);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err: unknown) {
    console.error("drive-images error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

async function resolveGoogleToken(supabase: any, userId: string): Promise<string | null> {
  const { data: googleConn } = await supabase
    .from("user_google_connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!googleConn) return null;

  const expiresAt = new Date(googleConn.token_expires_at).getTime();
  if (expiresAt > Date.now() + 60_000) return googleConn.access_token;

  if (!googleConn.refresh_token) return null;

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;

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

    if (!refreshRes.ok) return null;

    const refreshData = await refreshRes.json();
    const updateData: Record<string, string> = {
      access_token: refreshData.access_token,
      token_expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (refreshData.refresh_token) updateData.refresh_token = refreshData.refresh_token;

    await supabase.from("user_google_connections").update(updateData).eq("user_id", userId);
    return refreshData.access_token;
  } catch {
    return null;
  }
}

async function listDriveImages(googleAccessToken: string, json: Function) {
  const mimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  const q = "trashed = false and (" +
    mimeTypes.map((m) => "mimeType='" + m + "'").join(" or ") + ")";
  const fields = "files(id,name,mimeType,modifiedTime,thumbnailLink,webContentLink,size)";
  const listUrl = "https://www.googleapis.com/drive/v3/files?q=" +
    encodeURIComponent(q) + "&fields=" + encodeURIComponent(fields) +
    "&orderBy=modifiedTime%20desc&pageSize=50";

  const res = await fetch(listUrl, { headers: { Authorization: "Bearer " + googleAccessToken } });
  if (!res.ok) {
    const detail = await res.text();
    console.error("Drive image list failed:", detail);
    const isDisabled = detail.includes("accessNotConfigured") || detail.includes("SERVICE_DISABLED");
    return json({
      error: isDisabled ? "drive_api_disabled" : "Failed to list images from Google Drive",
      message: isDisabled
        ? "The Google Drive API is not enabled for this project. Enable it in Google Cloud, then try again."
        : "Google Drive could not return your images right now. Please try again shortly.",
      fallback: true,
      files: [],
    }, 200);
  }

  const data = await res.json();
  const files = (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    modifiedTime: f.modifiedTime,
    thumbnailLink: f.thumbnailLink,
    size: f.size ? parseInt(f.size) : null,
  }));

  return json({ files });
}

async function uploadToStorage(
  supabase: any,
  googleAccessToken: string,
  fileId: string,
  fileName: string,
  json: Function,
) {
  // Download image from Drive
  const dlRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: "Bearer " + googleAccessToken } },
  );

  if (!dlRes.ok) {
    const errText = await dlRes.text();
    console.error("Drive download failed:", errText);
    return json({ error: "Failed to download image from Google Drive" }, 500);
  }

  const contentType = dlRes.headers.get("content-type") || "image/jpeg";
  const imageBuffer = await dlRes.arrayBuffer();

  // Generate safe filename
  const ext = getExtFromMime(contentType);
  const safeName = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 80);
  const storagePath = `blog/${Date.now()}-${safeName}${ext}`;

  // Upload to Supabase storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("content-images")
    .upload(storagePath, new Uint8Array(imageBuffer), {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError);
    return json({ error: "Failed to upload image to storage: " + uploadError.message }, 500);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("content-images")
    .getPublicUrl(storagePath);

  return json({
    publicUrl: urlData.publicUrl,
    storagePath,
    originalFileId: fileId,
    originalFileName: fileName,
  });
}

async function bulkReplaceDriveImages(
  supabase: any,
  googleAccessToken: string,
  postId: string,
  json: Function,
) {
  // Get the blog post
  const { data: post, error: fetchError } = await supabase
    .from("blog_posts")
    .select("content, featured_image_url")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return json({ error: "Blog post not found" }, 404);
  }

  let content = post.content || "";
  let featuredImageUrl = post.featured_image_url || "";
  let replacedCount = 0;

  // Find all Google Drive image URLs in content
  const driveImagePattern = /(?:https?:\/\/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?[^"]*id=)|lh3\.googleusercontent\.com\/d\/))([a-zA-Z0-9_-]+)[^"'\s)>]*/gi;
  
  const driveUrls = new Set<string>();
  let match;
  
  // Scan content
  const contentPattern = /(?:src=["'])([^"']*(?:drive\.google\.com|lh3\.googleusercontent\.com)[^"']*)/gi;
  while ((match = contentPattern.exec(content)) !== null) {
    driveUrls.add(match[1]);
  }

  // Check featured image
  if (featuredImageUrl && (featuredImageUrl.includes("drive.google.com") || featuredImageUrl.includes("lh3.googleusercontent.com"))) {
    driveUrls.add(featuredImageUrl);
  }

  if (driveUrls.size === 0) {
    return json({ message: "No Google Drive images found in this post", replacedCount: 0 });
  }

  const replacements: Record<string, string> = {};

  for (const driveUrl of driveUrls) {
    // Extract file ID
    const idMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      driveUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
      driveUrl.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);

    if (!idMatch) continue;
    const fileId = idMatch[1];

    try {
      // Get file metadata for name
      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType`,
        { headers: { Authorization: "Bearer " + googleAccessToken } },
      );

      let fileName = fileId;
      if (metaRes.ok) {
        const meta = await metaRes.json();
        fileName = meta.name || fileId;
      }

      // Download and upload
      const dlRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: "Bearer " + googleAccessToken } },
      );

      if (!dlRes.ok) {
        console.error(`Failed to download Drive file ${fileId}`);
        continue;
      }

      const contentType = dlRes.headers.get("content-type") || "image/jpeg";
      const imageBuffer = await dlRes.arrayBuffer();

      const ext = getExtFromMime(contentType);
      const safeName = fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 80);
      const storagePath = `blog/${Date.now()}-${safeName}${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("content-images")
        .upload(storagePath, new Uint8Array(imageBuffer), { contentType, upsert: false });

      if (uploadError) {
        console.error(`Upload failed for ${fileId}:`, uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage.from("content-images").getPublicUrl(storagePath);
      replacements[driveUrl] = urlData.publicUrl;
      replacedCount++;
    } catch (e) {
      console.error(`Error processing Drive image ${fileId}:`, e);
    }
  }

  // Apply replacements
  for (const [oldUrl, newUrl] of Object.entries(replacements)) {
    content = content.split(oldUrl).join(newUrl);
    if (featuredImageUrl === oldUrl) {
      featuredImageUrl = newUrl;
    }
  }

  // Also replace lh3 URLs that correspond to replaced file IDs
  // Update the blog post
  const updateData: Record<string, string> = { content };
  if (featuredImageUrl !== post.featured_image_url) {
    updateData.featured_image_url = featuredImageUrl;
  }

  const { error: updateError } = await supabase
    .from("blog_posts")
    .update(updateData)
    .eq("id", postId);

  if (updateError) {
    return json({ error: "Images uploaded but failed to update post: " + updateError.message }, 500);
  }

  return json({ replacedCount, replacements: Object.keys(replacements).length });
}

function getExtFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };
  return map[mime] || ".jpg";
}
