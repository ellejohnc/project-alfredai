import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri: string;
}

async function generateServiceAccountToken(credentials: ServiceAccountCredentials): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureInput = `${headerB64}.${payloadB64}`;

  const pemContents = credentials.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(signatureInput));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  const tokenResponse = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Failed to get service account token: ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function fetchDocContent(doc: { id: string; file_name: string; file_url: string }, accessToken: string, supabase: any): Promise<string | null> {
  try {
    if (doc.file_url?.includes("docs.google.com/document/d/")) {
      const docIdMatch = doc.file_url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (docIdMatch) {
        const exportUrl = `https://www.googleapis.com/drive/v3/files/${docIdMatch[1]}/export?mimeType=text/plain`;
        const res = await fetch(exportUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) return await res.text();
        console.error(`Failed to export Google Doc ${docIdMatch[1]}: ${res.status}`);
      }
    } else if (doc.file_url?.includes("drive.google.com")) {
      const fileIdMatch = doc.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
        doc.file_url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        const res = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileIdMatch[1]}?alt=media`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (res.ok) return await res.text();
      }
    } else {
      const { data: fileData, error: dlError } = await supabase.storage
        .from("meeting-documents")
        .download(doc.file_url);
      if (!dlError && fileData) return await fileData.text();
    }
  } catch (e) {
    console.error(`Error fetching doc ${doc.id}:`, e);
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

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

    // Get documents from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: docs, error: docsError } = await supabase
      .from("meeting_documents")
      .select("id, file_name, file_url, document_type, source, created_at")
      .in("document_type", ["transcript", "summary", "notes"])
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: false })
      .limit(50);

    if (docsError) return json({ error: docsError.message }, 500);
    if (!docs || docs.length === 0) {
      return json({ analysis: "No meeting documents found in the last 30 days.", docsAnalyzed: 0 });
    }

    // Use service account for Google Drive access (same as google-drive-webhook)
    let googleAccessToken: string | null = null;
    const saJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (saJson) {
      try {
        const credentials: ServiceAccountCredentials = JSON.parse(saJson);
        googleAccessToken = await generateServiceAccountToken(credentials);
      } catch (e) {
        console.error("Failed to get service account token:", e);
      }
    }

    // Fetch content from each document (cap total to ~80K chars for AI context)
    const MAX_TOTAL_CHARS = 80000;
    const MAX_PER_DOC = 4000;
    const contents: string[] = [];
    let totalChars = 0;
    for (const doc of docs) {
      if (totalChars >= MAX_TOTAL_CHARS) break;

      let text: string | null = null;
      if (googleAccessToken) {
        text = await fetchDocContent(doc, googleAccessToken, supabase);
      } else {
        if (!doc.file_url?.includes("google.com")) {
          text = await fetchDocContent(doc, "", supabase);
        }
      }

      if (text && text.trim().length > 50) {
        const trimmed = text.length > MAX_PER_DOC ? text.substring(0, MAX_PER_DOC) + "\n...[truncated]" : text;
        contents.push(`--- ${doc.file_name} (${doc.created_at}) ---\n${trimmed}`);
        totalChars += trimmed.length;
      }
    }

    if (contents.length === 0) {
      return json({
        analysis: "Found meeting documents but could not retrieve readable text content. " +
          (googleAccessToken
            ? "The documents may be empty or in an unsupported format."
            : "Service account not configured — cannot access Google Docs."),
        docsAnalyzed: 0,
        totalDocs: docs.length,
      });
    }

    // Send to AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI API key not configured" }, 500);

    const systemPrompt = `You are an expert sales coach and meeting analyst. Analyze the following meeting transcripts and notes from the last 30 days. Provide a comprehensive report covering:

## 1. Executive Summary
Brief overview of meeting volume, types, and overall quality.

## 2. Sales Script Analysis
- Common patterns in successful vs unsuccessful pitches
- Specific phrases or approaches that worked well
- Areas where the script falls flat
- Before/after improvement examples

## 3. Meeting Dynamics & Framework
- How meetings are structured (discovery, demo, follow-up)
- Time allocation analysis
- Engagement patterns
- Suggested framework improvements

## 4. Client Sentiment Patterns
- Common objections and how they're handled
- Positive signals and buying indicators
- Red flags or missed opportunities

## 5. Actionable Recommendations
- Top 3 immediate improvements
- Suggested talk tracks for common scenarios
- Meeting preparation checklist

Be specific, reference actual content from the transcripts, and provide actionable advice.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze these ${contents.length} meeting transcripts/notes from the last 30 days:\n\n${contents.join("\n\n")}`,
          },
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", errText);
      // Return 200 with error info so frontend doesn't throw
      return json({
        error: "AI analysis could not be completed. The content may be too large or the AI service is temporarily unavailable. Please try again.",
        docsAnalyzed: contents.length,
        totalDocs: docs.length,
      });
    }

    const aiData = await aiRes.json();
    const analysis = aiData.choices?.[0]?.message?.content || "No analysis generated.";

    return json({ analysis, docsAnalyzed: contents.length, totalDocs: docs.length });
  } catch (err: unknown) {
    console.error("analyze-meeting-notes error:", err);
    return json({
      error: err instanceof Error ? err.message : "Unknown error",
      docsAnalyzed: 0,
      totalDocs: 0,
    });
  }
});
