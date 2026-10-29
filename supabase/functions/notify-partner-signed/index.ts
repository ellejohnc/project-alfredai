import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, PRODUCTION_URL, SUPPORT_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// William Zhang's admin account.
const ADMIN_EMAIL = "in@alfredai.bot";

const ok = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

interface SignedPayload {
  partner_legal_name?: string;
  signatory_name?: string;
  signatory_title?: string;
  territory?: string;
  agreement_version?: string;
}

function esc(input: string): string {
  return (input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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
  partner: string;
  signatory: string;
  title: string;
  territory: string;
  version: string;
  signedAt: string;
}): string {
  const adminLink = `${PRODUCTION_URL}/admin`;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Partner agreement signed</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><p style="margin:0;font-size:13px;color:#ffffff;opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">Consulting Partner Portal</p></td></tr><tr><td style="background-color:#ffffff;padding:40px;"><h2 style="margin:0 0 8px 0;font-size:24px;font-weight:600;color:#1e293b;">A partner has signed the agreement</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#475569;">${esc(p.partner)} has digitally signed the AlfredAI Consulting Partner Agreement.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:12px;margin:0 0 24px 0;"><tr><td style="padding:20px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-size:14px;color:#475569;"><tr><td style="padding:4px 0;color:#94a3b8;width:120px;">Partner</td><td style="padding:4px 0;color:#1e293b;font-weight:600;">${esc(p.partner)}</td></tr><tr><td style="padding:4px 0;color:#94a3b8;">Signatory</td><td style="padding:4px 0;color:#1e293b;">${esc(p.signatory)}${p.title ? ` &middot; ${esc(p.title)}` : ""}</td></tr><tr><td style="padding:4px 0;color:#94a3b8;">Territory</td><td style="padding:4px 0;color:#1e293b;">${esc(p.territory || "—")}</td></tr><tr><td style="padding:4px 0;color:#94a3b8;">Version</td><td style="padding:4px 0;color:#1e293b;">${esc(p.version)}</td></tr><tr><td style="padding:4px 0;color:#94a3b8;">Signed</td><td style="padding:4px 0;color:#1e293b;">${esc(p.signedAt)}</td></tr></table></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 8px 0;"><a href="${adminLink}" style="display:inline-block;background:linear-gradient(135deg,#ff4d8d 0%,#e63b78 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;">Open admin</a></td></tr></table></td></tr><tr><td style="background-color:#f1f5f9;padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Questions? Contact ${SUPPORT_EMAIL}</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Customised AI &amp; software for construction</p></td></tr></table></td></tr></table></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return ok({ success: false, error: "You must be signed in." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return ok({ success: false, error: "Your session has expired. Please sign in again." });
    }

    const body = (await req.json().catch(() => ({}))) as SignedPayload;

    // Confirm the signature actually exists for this user (don't trust the body alone).
    const { data: sig } = await supabase
      .from("partner_agreement_signatures")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!sig) {
      return ok({ success: false, error: "No signed agreement found for this account." });
    }

    const partner = sig.partner_legal_name || body.partner_legal_name || "A partner";
    const signatory = sig.signatory_name || body.signatory_name || "Unknown signatory";
    const title = sig.signatory_title || body.signatory_title || "";
    const territory = sig.territory || body.territory || "";
    const version = sig.agreement_version || body.agreement_version || "—";
    const signedAtIso = sig.signed_at || new Date().toISOString();
    const signedAtLabel = new Date(signedAtIso).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Australia/Sydney",
    });

    let emailSent = false;
    let inAppCreated = false;
    const errors: string[] = [];

    // 1) In-app notification for the admin (visible to admins via RLS).
    try {
      const { error: insErr } = await supabase.from("admin_notifications").insert({
        type: "partner_agreement_signed",
        title: "Partner agreement signed",
        body: `${partner} signed the Consulting Partner Agreement (signed by ${signatory}${title ? `, ${title}` : ""}).`,
        link: "/admin",
        metadata: {
          partner_legal_name: partner,
          signatory_name: signatory,
          signatory_title: title,
          territory,
          agreement_version: version,
          signed_at: signedAtIso,
          partner_user_id: user.id,
        },
      });
      if (insErr) throw insErr;
      inAppCreated = true;
    } catch (e) {
      console.error("Failed to create in-app notification", e);
      errors.push("in_app");
    }

    // 2) Email notification to William Zhang's admin account.
    try {
      await sendEmail(
        ADMIN_EMAIL,
        `Partner agreement signed — ${partner}`,
        buildEmail({ partner, signatory, title, territory, version, signedAt: signedAtLabel }),
      );
      emailSent = true;
    } catch (e) {
      console.error("Failed to send admin email", e);
      errors.push("email");
    }

    return ok({ success: true, emailSent, inAppCreated, errors });
  } catch (e) {
    console.error("notify-partner-signed error", e);
    return ok({ success: false, error: "Something went wrong while sending the notification." });
  }
};

serve(handler);
