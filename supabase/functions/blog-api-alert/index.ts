// Blog API failure alert checker.
// Counts recent failures in blog_api_log and emails the admin if the threshold
// is crossed AND no alert has been sent within the cooldown window.
//
// Returns 200 with { success: false, error } for handled errors per project rule.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BLOG_API_KEY = Deno.env.get("BLOG_API_KEY") ?? "";
const GMAIL_USER = Deno.env.get("GMAIL_USER") ?? "";
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD") ?? "";

// Default alert thresholds (used if config row is missing)
const DEFAULT_RECIPIENT = "elle.c@alfredai.bot";
const DEFAULT_THRESHOLD = 5;
const DEFAULT_WINDOW_MINUTES = 10;
const DEFAULT_COOLDOWN_MINUTES = 60;

async function loadConfig() {
  const { data } = await admin
    .from("blog_api_alert_config")
    .select("recipient, threshold, window_minutes, cooldown_minutes, enabled")
    .eq("id", 1)
    .maybeSingle();
  return {
    recipient: data?.recipient ?? DEFAULT_RECIPIENT,
    threshold: data?.threshold ?? DEFAULT_THRESHOLD,
    windowMinutes: data?.window_minutes ?? DEFAULT_WINDOW_MINUTES,
    cooldownMinutes: data?.cooldown_minutes ?? DEFAULT_COOLDOWN_MINUTES,
    enabled: data?.enabled ?? true,
  };
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function ok(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendAlertEmail(opts: {
  recipient: string;
  errorCount: number;
  windowMinutes: number;
  threshold: number;
  errors: Array<{ action: string; slug: string | null; error: string | null; created_at: string }>;
  isTest?: boolean;
  cooldownMinutes?: number;
}) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("email_not_configured: GMAIL_USER or GMAIL_APP_PASSWORD missing");
  }

  const subject = opts.isTest
    ? "[TEST] Blog API alert email"
    : `🚨 Blog API: ${opts.errorCount} failures in ${opts.windowMinutes} min`;

  const rows = opts.errors
    .map(
      (e) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#0F172A;">${escapeHtml(e.action)}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:12px;color:#475569;">${escapeHtml(e.slug ?? "—")}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#dc2626;">${escapeHtml(e.error ?? "")}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#94a3b8;white-space:nowrap;">${escapeHtml(new Date(e.created_at).toLocaleString("en-AU"))}</td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;">
  <div style="background:#0F172A;padding:20px 24px;">
    <h1 style="margin:0;color:#FF4D8D;font-size:20px;">Blog API Alert</h1>
  </div>
  <div style="padding:24px;">
    ${opts.isTest ? '<p style="margin:0 0 16px;padding:10px;background:#fef3c7;color:#92400e;border-radius:6px;font-size:13px;"><strong>This is a test message.</strong> Your alert pipeline is working.</p>' : ""}
    <p style="margin:0 0 16px;color:#0F172A;font-size:15px;">
      <strong>${opts.errorCount}</strong> Blog API failure${opts.errorCount === 1 ? "" : "s"} detected in the last <strong>${opts.windowMinutes} minutes</strong> (threshold: ${opts.threshold}).
    </p>
    <p style="margin:0 0 16px;color:#475569;font-size:13px;">
      Your n8n workflow may be broken. Open the admin panel to investigate.
    </p>
    <a href="https://www.alfredai.bot/admin/content/blog" style="display:inline-block;background:#FF4D8D;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Open Blog Admin →</a>

    <h2 style="margin:28px 0 8px;color:#0F172A;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">Recent failures</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;">
      <thead><tr style="background:#f1f5f9;">
        <th style="text-align:left;padding:8px 10px;font-size:11px;color:#475569;">Action</th>
        <th style="text-align:left;padding:8px 10px;font-size:11px;color:#475569;">Slug</th>
        <th style="text-align:left;padding:8px 10px;font-size:11px;color:#475569;">Error</th>
        <th style="text-align:left;padding:8px 10px;font-size:11px;color:#475569;">When</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="4" style="padding:12px;color:#94a3b8;font-size:12px;">No recent failures.</td></tr>'}</tbody>
    </table>
    <p style="margin:24px 0 0;color:#94a3b8;font-size:11px;">You will not receive another alert for this incident for ${opts.cooldownMinutes ?? ""} minutes.</p>
  </div>
</div>
</body></html>`;

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
    },
  });

  try {
    await client.send({
      from: `alfred ai Alerts <${GMAIL_USER}>`,
      to: opts.recipient,
      subject,
      content: "auto",
      html,
    });
  } finally {
    await Promise.resolve(client.close()).catch(() => {});
  }
}

async function runCheck(opts: { force?: boolean; isTest?: boolean } = {}) {
  const cfg = await loadConfig();

  if (!cfg.enabled && !opts.isTest && !opts.force) {
    return { success: true, sent: false, disabled: true };
  }

  const since = new Date(Date.now() - cfg.windowMinutes * 60 * 1000).toISOString();

  const { data: errors, error: errLoad } = await admin
    .from("blog_api_log")
    .select("action, slug, error, created_at")
    .eq("success", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20);

  if (errLoad) {
    return { success: false, error: errLoad.message };
  }

  const errorCount = errors?.length ?? 0;
  const thresholdHit = errorCount >= cfg.threshold;

  if (!thresholdHit && !opts.isTest) {
    return { success: true, sent: false, error_count: errorCount, threshold: cfg.threshold };
  }

  // Cooldown check
  if (!opts.force && !opts.isTest) {
    const cooldownSince = new Date(Date.now() - cfg.cooldownMinutes * 60 * 1000).toISOString();
    const { data: recent } = await admin
      .from("blog_api_alerts")
      .select("id, sent_at")
      .eq("status", "sent")
      .gte("sent_at", cooldownSince)
      .order("sent_at", { ascending: false })
      .limit(1);
    if (recent && recent.length > 0) {
      return {
        success: true,
        sent: false,
        cooldown: true,
        last_sent_at: recent[0].sent_at,
        error_count: errorCount,
      };
    }
  }

  try {
    await sendAlertEmail({
      recipient: cfg.recipient,
      errorCount,
      windowMinutes: cfg.windowMinutes,
      threshold: cfg.threshold,
      errors: errors ?? [],
      isTest: opts.isTest,
      cooldownMinutes: cfg.cooldownMinutes,
    });
    await admin.from("blog_api_alerts").insert({
      recipient: cfg.recipient,
      error_count: errorCount,
      window_minutes: cfg.windowMinutes,
      threshold: cfg.threshold,
      sample_errors: errors ?? [],
      status: "sent",
    });
    return { success: true, sent: true, recipient: cfg.recipient, error_count: errorCount };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from("blog_api_alerts").insert({
      recipient: cfg.recipient,
      error_count: errorCount,
      window_minutes: cfg.windowMinutes,
      threshold: cfg.threshold,
      sample_errors: errors ?? [],
      status: "failed",
      error_message: msg,
    });
    return { success: false, error: msg };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Two auth modes: x-api-key (for inline trigger from blog-api) OR authenticated admin user.
  const apiKey = req.headers.get("x-api-key") ?? "";
  const internalAuth = BLOG_API_KEY && apiKey === BLOG_API_KEY;

  let isAdmin = false;
  if (!internalAuth) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (token) {
      const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (userData?.user) {
        const { data: roleCheck } = await admin.rpc("is_admin", { _user_id: userData.user.id });
        isAdmin = roleCheck === true;
      }
    }
  }

  if (!internalAuth && !isAdmin) {
    return ok({ success: false, error: "unauthorized" });
  }

  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  } else {
    const url = new URL(req.url);
    body = Object.fromEntries(url.searchParams.entries());
  }

  const isTest = body.test === true || body.test === "true";
  // Admin-triggered force send; never honoured for the inline internal call
  const force = isAdmin && (body.force === true || body.force === "true");

  try {
    const result = await runCheck({ isTest, force });
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return ok({ success: false, error: msg });
  }
});
