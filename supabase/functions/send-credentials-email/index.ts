import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL } from "../_shared/config.ts";

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

function buildCredentialsEmail(t: EmailTemplate, displayName: string, email: string, password: string, roleName: string, loginUrl: string): string {
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html.replace(/{{displayName}}/g, displayName).replace(/{{email}}/g, email).replace(/{{password}}/g, password).replace(/{{roleName}}/g, roleName).replace(/{{loginUrl}}/g, loginUrl);
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:${t.heading_color};">AlfredAI</h1><p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;">${t.heading}</p></td></tr><tr><td style="background-color:${t.body_bg_color};padding:40px;"><h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Hello, ${displayName}!</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${t.body_text}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="background-color:${t.footer_bg_color};border:1px solid #e2e8f0;border-radius:12px;padding:8px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="padding:16px 0;border-bottom:1px solid #e2e8f0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Email</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">${email}</p></td></tr><tr><td style="padding:16px 0;border-bottom:1px solid #e2e8f0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Temporary Password</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;font-family:monospace;background-color:#fef3c7;padding:8px 12px;border-radius:6px;display:inline-block;">${password}</p></td></tr><tr><td style="padding:16px 0;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;">Role</p><p style="margin:0;font-size:16px;font-weight:600;color:#1e293b;">${roleName}</p></td></tr></table></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 24px 0;"><a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%);color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px ${t.button_bg_start}66;">${t.button_text || 'Sign In Now'}</a></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:16px;"><tr><td style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;"><p style="margin:0;font-size:14px;color:#991b1b;line-height:1.5;"><strong>Security Notice:</strong> Please change your password immediately after your first login.</p></td></tr></table></td></tr><tr><td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text || 'If you did not expect this email, please contact your administrator.'}</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Intelligent Business Automation</p></td></tr></table></td></tr></table></body></html>`;
}

const defaultTemplate: EmailTemplate = { subject: "Your AlfredAI Login Credentials", heading: "Welcome Aboard", body_text: "Your admin account has been created. Below are your login credentials.", button_text: "Sign In Now", footer_text: "If you did not expect this email, please contact your administrator.", custom_html: null, use_custom_html: false, ...defaultColors };

interface SendCredentialsRequest { email: string; password: string; displayName: string; role: string; loginUrl: string; }

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");
    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleData || !["admin", "super_admin"].includes(roleData.role)) throw new Error("Only admins can send credentials");
    const { email, password, displayName, role, loginUrl }: SendCredentialsRequest = await req.json();
    if (!email || !password) throw new Error("Email and password are required");
    const template = await getEmailTemplate(supabase, "credentials") || defaultTemplate;
    const roleName = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Editor';
    const emailHtml = buildCredentialsEmail(template, displayName, email, password, roleName, loginUrl);
    await sendEmail(email, template.subject, emailHtml);
    console.log("Credentials email sent");
    await supabase.from("activity_logs").insert({ user_id: user.id, user_email: user.email, action: "credentials_sent", resource_type: "user", resource_name: email, details: { role, sent_to: email } });
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error in send-credentials-email:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
