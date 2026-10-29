// Blog API for n8n — image upload + post upsert + list
// All handled errors return HTTP 200 with { success: false, error } per project rule.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BLOG_API_KEY = Deno.env.get("BLOG_API_KEY") ?? "";
const BUCKET = "content-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function ok(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function triggerAlertCheck() {
  try {
    // Fire-and-forget. The alert function enforces its own threshold + cooldown.
    const url = `${SUPABASE_URL}/functions/v1/blog-api-alert`;
    const p = fetch(url, {
      method: "POST",
      headers: { "x-api-key": BLOG_API_KEY, "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});
    // @ts-ignore EdgeRuntime is provided by Supabase
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(p);
    }
  } catch (_) { /* ignore */ }
}

async function log(action: string, slug: string | null, statusCode: number, success: boolean, error: string | null, payload: unknown, ip: string | null) {
  try {
    await admin.from("blog_api_log").insert({
      action, slug, status_code: statusCode, success, error,
      payload_preview: payload ? JSON.parse(JSON.stringify(payload).slice(0, 2000)) : null,
      ip,
    });
  } catch (_) { /* ignore */ }
  // On any failure, kick off the alert checker non-blocking.
  if (!success) triggerAlertCheck();
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, "");
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Path after /blog-api
  const path = url.pathname.replace(/^.*\/blog-api/, "") || "/";
  const ip = req.headers.get("x-forwarded-for") ?? null;

  // Auth
  const key = req.headers.get("x-api-key") ?? "";
  if (!BLOG_API_KEY || key !== BLOG_API_KEY) {
    await log("auth", null, 401, false, "unauthorized", null, ip);
    return ok({ success: false, error: "unauthorized" });
  }

  try {
    // GET /posts/:slug — returns full post including HTML body (content)
    const slugMatch = req.method === "GET" ? path.match(/^\/posts\/([^/?]+)\/?$/) : null;
    if (slugMatch) {
      const reqSlug = decodeURIComponent(slugMatch[1]);
      const { data, error } = await admin
        .from("blog_posts")
        .select("id, slug, title, excerpt, content, category, tags, featured_image_url, status, source, published_at, created_at, updated_at")
        .eq("slug", reqSlug)
        .maybeSingle();
      if (error) {
        await log("get", reqSlug, 200, false, error.message, null, ip);
        return ok({ success: false, error: error.message });
      }
      if (!data) {
        await log("get", reqSlug, 200, false, "not_found", null, ip);
        return ok({ success: false, error: `not_found: ${reqSlug}` });
      }
      await log("get", reqSlug, 200, true, null, null, ip);
      return ok({ success: true, post: data });
    }

    // GET /posts (list)
    if (req.method === "GET" && path.startsWith("/posts")) {
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 100);
      const { data, error } = await admin
        .from("blog_posts")
        .select("id, slug, title, status, published_at, source, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        await log("list", null, 200, false, error.message, null, ip);
        return ok({ success: false, error: error.message });
      }
      await log("list", null, 200, true, null, { limit }, ip);
      return ok({ success: true, posts: data });
    }

    // POST /images
    if (req.method === "POST" && path.startsWith("/images")) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") return ok({ success: false, error: "invalid_json" });
      const { filename, contentBase64, contentType } = body as Record<string, string>;
      if (!filename || !contentBase64 || !contentType) {
        await log("image", null, 200, false, "missing_fields", body, ip);
        return ok({ success: false, error: "missing_fields: filename, contentBase64, contentType required" });
      }
      if (!ALLOWED_TYPES.has(contentType)) {
        await log("image", null, 200, false, "unsupported_type", { contentType }, ip);
        return ok({ success: false, error: `unsupported_type: ${contentType}` });
      }
      const bytes = base64ToBytes(contentBase64);
      if (bytes.byteLength > MAX_IMAGE_BYTES) {
        await log("image", null, 200, false, "too_large", { size: bytes.byteLength }, ip);
        return ok({ success: false, error: "too_large: max 10MB" });
      }
      const now = new Date();
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `blog/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
        contentType, upsert: false,
      });
      if (upErr) {
        await log("image", null, 200, false, upErr.message, { path }, ip);
        return ok({ success: false, error: upErr.message });
      }
      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
      await log("image", null, 200, true, null, { path }, ip);
      return ok({ success: true, url: pub.publicUrl, path });
    }

    // POST /posts (upsert by slug)
    if (req.method === "POST" && path.startsWith("/posts")) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") return ok({ success: false, error: "invalid_json" });
      const b = body as Record<string, unknown>;
      const title = typeof b.title === "string" ? b.title.trim() : "";
      if (!title) {
        await log("post", null, 200, false, "missing_title", b, ip);
        return ok({ success: false, error: "missing_title" });
      }
      const slug = (typeof b.slug === "string" && b.slug.trim()) ? slugify(b.slug as string) : slugify(title);
      const status = b.status === "published" ? "published" : "draft";
      const row: Record<string, unknown> = {
        title,
        slug,
        excerpt: typeof b.excerpt === "string" ? b.excerpt : null,
        content: typeof b.content === "string" ? b.content : null,
        category: typeof b.category === "string" ? b.category : null,
        tags: Array.isArray(b.tags) ? (b.tags as unknown[]).filter((t) => typeof t === "string") : null,
        featured_image_url: typeof b.featured_image_url === "string" ? b.featured_image_url : null,
        status,
        source: "api",
        updated_at: new Date().toISOString(),
      };
      if (status === "published") row.published_at = new Date().toISOString();

      const { data, error } = await admin
        .from("blog_posts")
        .upsert(row, { onConflict: "slug" })
        .select("id, slug, status, published_at")
        .single();
      if (error) {
        await log("post", slug, 200, false, error.message, b, ip);
        return ok({ success: false, error: error.message });
      }
      await log("post", slug, 200, true, null, { title, status }, ip);
      return ok({
        success: true,
        id: data.id,
        slug: data.slug,
        status: data.status,
        url: `/blog/${data.slug}`,
      });
    }

    await log("unknown", null, 404, false, "not_found", { path, method: req.method }, ip);
    return ok({ success: false, error: `not_found: ${req.method} ${path}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log("error", null, 200, false, msg, null, ip);
    return ok({ success: false, error: msg });
  }
});
