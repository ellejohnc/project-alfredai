import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL } from "../_shared/config.ts";
import { isInternalCaller, forbiddenResponse, isSafeLinkUrl, escapeHtml } from "../_shared/requestGuards.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailTemplate {
  subject: string;
  heading: string;
  body_text: string;
  button_text: string | null;
  footer_text: string | null;
  custom_html: string | null;
  use_custom_html: boolean;
  header_bg_start: string;
  header_bg_end: string;
  button_bg_start: string;
  button_bg_end: string;
  body_bg_color: string;
  footer_bg_color: string;
  text_color: string;
  heading_color: string;
  button_text_color: string;
}

const defaultColors = {
  header_bg_start: '#1e293b',
  header_bg_end: '#334155',
  button_bg_start: '#3b82f6',
  button_bg_end: '#2563eb',
  body_bg_color: '#ffffff',
  footer_bg_color: '#f1f5f9',
  text_color: '#475569',
  heading_color: '#ffffff',
  button_text_color: '#ffffff',
};

async function getEmailTemplate(supabase: any, templateKey: string): Promise<EmailTemplate | null> {
  const { data, error } = await supabase.from("email_templates").select("*").eq("template_key", templateKey).maybeSingle();
  if (error) { console.error("Error fetching template:", error); return null; }
  if (data) {
    return { ...data,
      header_bg_start: data.header_bg_start || defaultColors.header_bg_start,
      header_bg_end: data.header_bg_end || defaultColors.header_bg_end,
      button_bg_start: data.button_bg_start || defaultColors.button_bg_start,
      button_bg_end: data.button_bg_end || defaultColors.button_bg_end,
      body_bg_color: data.body_bg_color || defaultColors.body_bg_color,
      footer_bg_color: data.footer_bg_color || defaultColors.footer_bg_color,
      text_color: data.text_color || defaultColors.text_color,
      heading_color: data.heading_color || defaultColors.heading_color,
      button_text_color: data.button_text_color || defaultColors.button_text_color,
    };
  }
  return null;
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) throw new Error("Gmail credentials not configured");
  
  const client = new SMTPClient({ 
    connection: { 
      hostname: "smtp.gmail.com", 
      port: 465, 
      tls: true, 
      auth: { username: gmailUser, password: gmailPassword } 
    } 
  });
  
  try {
    await client.send({ 
      from: `alfred ai <${gmailUser}>`, 
      to, 
      subject, 
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html: html,
    }); 
    console.log(`Email sent to ${to}`); 
  } finally { 
    await client.close(); 
  }
  return { success: true };
}

function buildPasswordResetEmail(t: EmailTemplate, displayName: string, resetLink: string): string {
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html.replace(/{{displayName}}/g, displayName).replace(/{{resetLink}}/g, resetLink);
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:${t.heading_color};">AlfredAI</h1><p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;">${t.heading}</p></td></tr><tr><td style="background-color:${t.body_bg_color};padding:40px;"><h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Reset Your Password</h2><p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${t.text_color};">Hi <strong style="color:#1e293b;">${displayName}</strong>,</p><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${t.body_text}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 24px 0;"><a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%);color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px ${t.button_bg_start}66;">${t.button_text || 'Reset Password'}</a></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;"><tr><td style="background-color:#fef3c7;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;"><p style="margin:0;font-size:14px;color:#92400e;line-height:1.5;"><strong>Important:</strong> This is a <strong>single-use</strong> link that expires in 1 hour. For it to work, please open it <strong>directly from this email</strong> in your own browser. Avoid forwarding it or opening link previews/scanners, which can use up the link before you click it. If it says the link has expired, just request a new one.</p></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;"><p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p><p style="margin:0;font-size:13px;color:${t.button_bg_start};word-break:break-all;">${resetLink}</p></td></tr></table></td></tr><tr><td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text || "If you didn't request this password reset, you can safely ignore this email."}</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Intelligent Business Automation</p></td></tr></table></td></tr></table></body></html>`;
}

const defaultTemplate: EmailTemplate = { subject: "Reset Your AlfredAI Password", heading: "Password Reset", body_text: "We received a request to reset your password. Click the button below to create a new password. This link can only be used once, so please open it directly from this email.", button_text: "Reset Password", footer_text: "If you didn't request this password reset, you can safely ignore this email.", custom_html: null, use_custom_html: false, ...defaultColors };

interface PasswordResetRequest { email: string; resetLink: string; userName?: string; }

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  // Internal-only: this email carries a reset link, so only our own backend
  // (request-password-reset / admin-password-reset) may trigger it.
  if (!isInternalCaller(req)) {
    console.warn("[SEND-PASSWORD-RESET] Rejected unauthenticated caller");
    return forbiddenResponse(corsHeaders);
  }
  try {
    const { email, resetLink, userName }: PasswordResetRequest = await req.json();
    if (!email || !resetLink) throw new Error("Email and reset link are required");
    if (!isSafeLinkUrl(resetLink)) {
      console.warn("[SEND-PASSWORD-RESET] Rejected off-domain reset link");
      return new Response(
        JSON.stringify({ success: false, error: "Reset link must point to an AlfredAI domain." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const template = await getEmailTemplate(supabase, "password-reset") || defaultTemplate;
    const displayName = userName || email.split('@')[0];
    const emailHtml = buildPasswordResetEmail(template, escapeHtml(displayName), escapeHtml(resetLink));
    await sendEmail(email, template.subject, emailHtml);
    console.log("Password reset email sent");
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
