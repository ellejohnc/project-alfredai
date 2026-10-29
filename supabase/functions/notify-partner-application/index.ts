import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, PRODUCTION_URL, SUPPORT_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Single recipient for new-partner-application alerts. Keep this to ONE address.
const ADMIN_EMAIL = "in@alfredai.bot";

// Link straight to where applications are actually reviewed.
const PORTAL_ADMIN_URL = `${PRODUCTION_URL}/partners/portal/admin`;

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

function esc(input: string): string {
  return (input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

interface ApplicationPayload {
  application_id?: string;
  email?: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) {
    throw new Error("Email service is not configured");
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailPassword },
    },
  });

  try {
    await client.send({
      from: `alfred ai <${gmailUser}>`,
      to,
      subject,
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html,
    });
  } finally {
    await client.close();
  }
}

function buildEmail(p: {
  fullName: string;
  email: string;
  company: string;
  phone: string;
  territory: string;
  appliedAt: string;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:4px 0;color:#94a3b8;width:120px;">${esc(label)}</td><td style="padding:4px 0;color:#1e293b;font-weight:600;">${esc(value)}</td></tr>`;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>New partner application</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><p style="margin:0;font-size:13px;color:#ffffff;opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">Consulting Partner Portal</p></td></tr><tr><td style="background-color:#ffffff;padding:40px;"><h2 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#1e293b;">New partner application</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#475569;">${esc(p.fullName)} has applied to join the AlfredAI Consulting Partner Portal. Review and approve them below.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:12px;margin:0 0 24px 0;"><tr><td style="padding:20px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;color:#475569;">${row("Name", p.fullName)}${row("Email", p.email)}${row("Company", p.company)}${row("Phone", p.phone)}${row("Territory", p.territory)}${row("Applied", p.appliedAt)}</table></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 8px 0;"><a href="${PORTAL_ADMIN_URL}" style="display:inline-block;background:linear-gradient(135deg,#ff4d8d 0%,#e63b78 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;">Review application</a></td></tr></table></td></tr><tr><td style="background-color:#f1f5f9;padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Questions? Contact ${SUPPORT_EMAIL}</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Customised AI &amp; software for construction</p></td></tr></table></td></tr></table></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as ApplicationPayload;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Look up the application server-side so we never trust client-supplied details.
    // Match by id when provided, otherwise fall back to the most recent pending
    // application for that email.
    let query = supabase
      .from("partner_applications")
      .select("full_name, email, company, phone, territory, created_at, status")
      .order("created_at", { ascending: false })
      .limit(1);

    if (body.application_id) {
      query = query.eq("id", body.application_id);
    } else if (body.email) {
      query = query.eq("email", body.email.trim().toLowerCase());
    } else {
      return ok({ success: false, error: "An application id or email is required." });
    }

    const { data: app, error } = await query.maybeSingle();
    if (error) {
      console.error("notify-partner-application lookup failed:", error);
      return ok({ success: false, error: "Could not load the application." });
    }
    if (!app) {
      return ok({ success: false, error: "No matching application found." });
    }

    const appliedAt = new Date(app.created_at || new Date().toISOString()).toLocaleString(
      "en-AU",
      { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }
    );

    const html = buildEmail({
      fullName: app.full_name || "A new applicant",
      email: app.email || "—",
      company: app.company || "Not provided",
      phone: app.phone || "Not provided",
      territory: app.territory || "—",
      appliedAt,
    });

    await sendEmail(
      ADMIN_EMAIL,
      `New partner application — ${app.full_name || app.email || "applicant"}`,
      html
    );

    return ok({ success: true });
  } catch (err) {
    console.error("notify-partner-application error:", err);
    // Never surface a hard failure — the application itself already succeeded.
    return ok({ success: false, error: err instanceof Error ? err.message : "Unknown error" });
  }
};

serve(handler);
