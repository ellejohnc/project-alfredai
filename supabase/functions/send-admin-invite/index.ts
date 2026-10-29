import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, PRODUCTION_URL } from "../_shared/config.ts";

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
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("template_key", templateKey)
    .maybeSingle();

  if (error) {
    console.error("Error fetching template:", error);
    return null;
  }
  
  if (data) {
    return {
      ...data,
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

  if (!gmailUser || !gmailPassword) {
    throw new Error("Gmail credentials not configured");
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
      html: html,
    });
    console.log(`Email sent successfully to ${to}`);
  } finally {
    await client.close();
  }
  return { success: true };
}

function buildInviteEmail(t: EmailTemplate, inviterName: string, roleName: string, inviteLink: string, inviterEmail: string): string {
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html
      .replace(/{{inviterName}}/g, inviterName)
      .replace(/{{roleName}}/g, roleName)
      .replace(/{{inviteLink}}/g, inviteLink)
      .replace(/{{inviterEmail}}/g, inviterEmail);
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:${t.heading_color};letter-spacing:-0.5px;">AlfredAI</h1><p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">${t.heading}</p></td></tr><tr><td style="background-color:${t.body_bg_color};padding:40px;"><h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">You've Been Invited</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};"><strong style="color:#1e293b;">${inviterName}</strong> has invited you to join the AlfredAI Admin Panel.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;"><tr><td style="background-color:${t.footer_bg_color};border-radius:8px;padding:16px 24px;"><p style="margin:0 0 4px 0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:500;">Your Role</p><p style="margin:0;font-size:18px;font-weight:600;color:#1e293b;">${roleName}</p></td></tr></table><p style="margin:0 0 32px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${t.body_text}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:8px 0 32px 0;"><a href="${inviteLink}" style="display:inline-block;background:linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%);color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px ${t.button_bg_start}66;">${t.button_text || 'Accept Invitation'}</a></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;"><tr><td style="border-top:1px solid #e2e8f0;padding-top:24px;"><p style="margin:0 0 8px 0;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p><p style="margin:0;font-size:13px;color:${t.button_bg_start};word-break:break-all;">${inviteLink}</p></td></tr></table></td></tr><tr><td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text || `This invitation expires in <strong>24 hours</strong><br>Invited by ${inviterEmail}`}</p></td></tr><tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Intelligent Business Automation</p></td></tr></table></td></tr></table></body></html>`;
}

const defaultTemplate: EmailTemplate = {
  subject: "You're Invited to Join AlfredAI Admin",
  heading: "You're Invited!",
  body_text: "Click the button below to create your account and get started.",
  button_text: "Accept Invitation",
  footer_text: "This invitation will expire in 24 hours.",
  custom_html: null,
  use_custom_html: false,
  ...defaultColors,
};

interface InviteRequest {
  email: string;
  role: string;
  inviterEmail: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    if (!roleData || !["admin", "super_admin"].includes(roleData.role)) throw new Error("Only admins can send invitations");

    const { email, role, inviterEmail, inviterName }: InviteRequest = await req.json();
    if (!email) throw new Error("Email is required");

    // Check if user already exists in admin_users
    const { data: existingUser } = await supabase.from("admin_users").select("id").eq("email", email).maybeSingle();
    if (existingUser) throw new Error("A user with this email already exists. Delete the existing account first to send a new invite.");

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase.from("pending_invitations").select("id").eq("email", email).maybeSingle();
    if (existingInvite) {
      // Delete the old invitation and create a new one
      await supabase.from("pending_invitations").delete().eq("id", existingInvite.id);
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: invitation, error: inviteError } = await supabase.from("pending_invitations").insert({ email, role, invited_by: user.id, invited_by_email: inviterEmail, expires_at: expiresAt }).select().single();
    if (inviteError) throw inviteError;

    const template = await getEmailTemplate(supabase, "invite") || defaultTemplate;
    // Always use PRODUCTION_URL for invite links so the link works regardless of where the invite was sent from (preview vs production)
    const inviteLink = `${PRODUCTION_URL}/admin/accept-invite?token=${invitation.token}`;
    const roleName = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Editor';
    const emailHtml = buildInviteEmail(template, inviterName, roleName, inviteLink, inviterEmail);

    await sendEmail(email, template.subject, emailHtml);
    console.log("Invitation email sent");

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_email: inviterEmail,
      action: "invite_sent",
      resource_type: "invitation",
      resource_id: invitation.id,
      resource_name: email,
      details: { role, invited_email: email },
    });

    return new Response(JSON.stringify({ success: true, invitation: { id: invitation.id, email } }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error in send-admin-invite:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
};

serve(handler);
