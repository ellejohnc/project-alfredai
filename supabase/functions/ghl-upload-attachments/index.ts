import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  GHL_BASE,
  GHL_VERSION,
  BROWSER_UA,
  GHL_LOCATION_ID,
  requireAdmin,
} from "../_shared/ghlClient.ts";

/**
 * Upload attachments to GHL so they can be sent with an outbound message.
 *
 * Body (POST JSON):
 *   {
 *     conversation_id?: string,
 *     files: [{ name: string, type: string, data: string /* base64, no data: prefix *\/ }]
 *   }
 * Returns: { success, urls: string[] }
 *
 * GHL limits: max 5 files, 5MB each. We enforce both before touching GHL so a
 * bad payload fails fast with a readable message instead of an opaque 4xx.
 */
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj: unknown) =>
    new Response(JSON.stringify(obj), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const auth = await requireAdmin(req, supabase);
    if (!auth.ok) return json({ success: false, error: auth.error, urls: [] });

    const apiKey = Deno.env.get("GHL_API_KEY");
    if (!apiKey) return json({ success: false, error: "GHL_API_KEY missing", urls: [] });

    const body = await req.json().catch(() => ({}));
    const conversationId = String(body?.conversation_id || "").trim();
    const files: any[] = Array.isArray(body?.files) ? body.files : [];

    if (files.length === 0) return json({ success: false, error: "No files provided", urls: [] });
    if (files.length > MAX_FILES) {
      return json({ success: false, error: `Max ${MAX_FILES} files per upload`, urls: [] });
    }

    const form = new FormData();
    form.append("locationId", GHL_LOCATION_ID);
    if (conversationId) form.append("conversationId", conversationId);

    for (const f of files) {
      const name = String(f?.name || "attachment");
      const type = String(f?.type || "application/octet-stream");
      let bytes: Uint8Array;
      try {
        bytes = base64ToBytes(String(f?.data || ""));
      } catch {
        return json({ success: false, error: `Could not read file: ${name}`, urls: [] });
      }
      if (bytes.byteLength === 0) {
        return json({ success: false, error: `Empty file: ${name}`, urls: [] });
      }
      if (bytes.byteLength > MAX_BYTES) {
        return json({ success: false, error: `${name} is over the 5MB limit`, urls: [] });
      }
      form.append("fileAttachment", new Blob([bytes as BlobPart], { type }), name);
    }

    // Multipart — must NOT set Content-Type manually (boundary is generated).
    const res = await fetch(`${GHL_BASE}/conversations/messages/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_VERSION,
        Accept: "application/json",
        "User-Agent": BROWSER_UA,
      },
      body: form,
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[ghl-upload-attachments] upstream", res.status, text.slice(0, 300));
      return json({
        success: false,
        error: `Upload failed (${res.status}): ${text.slice(0, 200)}`,
        urls: [],
      });
    }

    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* ignore */ }
    const raw = parsed?.uploadedFiles ?? parsed?.files ?? parsed ?? {};
    const urls: string[] = Array.isArray(raw)
      ? raw.map((v: any) => (typeof v === "string" ? v : v?.url)).filter(Boolean)
      : Object.values(raw).filter((v): v is string => typeof v === "string");

    if (urls.length === 0) {
      return json({ success: false, error: "GHL returned no file URLs", urls: [] });
    }
    return json({ success: true, urls });
  } catch (err) {
    console.error("[ghl-upload-attachments] error", err);
    return json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
      urls: [],
    });
  }
});
