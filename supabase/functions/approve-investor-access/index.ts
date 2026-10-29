import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, PAGE_URLS } from "../_shared/config.ts";

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
  header_bg_start: '#059669',
  header_bg_end: '#047857',
  button_bg_start: '#3b82f6',
  button_bg_end: '#2563eb',
  body_bg_color: '#ffffff',
  footer_bg_color: '#f1f5f9',
  text_color: '#475569',
  heading_color: '#ffffff',
  button_text_color: '#ffffff',
};

const defaultTemplate: EmailTemplate = {
  subject: "Your AlfredAI Investor Portal Access Code",
  heading: "Access Approved",
  body_text: "Your request to access the AlfredAI Investor Portal has been approved. Use the access code below to log in.",
  button_text: "Access Investor Portal",
  footer_text: "This code is valid for 12 months. If you have any questions, please reply to this email.",
  custom_html: null,
  use_custom_html: false,
  ...defaultColors
};

interface ApproveRequest {
  investorId: string;
  admin_notes?: string;
  resend?: boolean;
}

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getEmailTemplate(supabase: any, templateKey: string): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("template_key", templateKey)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching template:", error);
    return defaultTemplate;
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
  
  return defaultTemplate;
}

function buildApprovalEmail(
  t: EmailTemplate,
  firstName: string,
  accessCode: string,
  expiresFormatted: string,
  portalUrl: string,
  isResend: boolean
): string {
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{accessCode}}/g, accessCode)
      .replace(/{{expiresFormatted}}/g, expiresFormatted)
      .replace(/{{portalUrl}}/g, portalUrl);
  }

  const subject = isResend ? `${t.subject} (Resent)` : t.subject;
  const headerGradient = `linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%)`;
  const buttonGradient = `linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%)`;
  const buttonShadow = `0 4px 14px ${t.button_bg_start}66`;
  const currentYear = new Date().getFullYear();

  // Build HTML as joined array to prevent =20 encoding issues
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    `<title>${subject}</title>`,
    '</head>',
    `<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">`,
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;">',
    '<tr>',
    '<td style="padding:48px 24px;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">',
    // Header
    '<tr>',
    `<td style="background:${headerGradient};border-radius:16px 16px 0 0;padding:40px;text-align:center;">`,
    `<img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;">`,
    `<div style="display:inline-block;background:rgba(255,255,255,0.2);padding:8px 16px;border-radius:20px;margin-bottom:12px;">`,
    `<span style="color:${t.heading_color};font-size:14px;font-weight:600;">✓ ${t.heading}</span>`,
    '</div>',
    `<p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;">AlfredAI Investor Portal</p>`,
    '</td>',
    '</tr>',
    // Body
    '<tr>',
    `<td style="background-color:${t.body_bg_color};padding:40px;">`,
    `<h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Hello, ${firstName}!</h2>`,
    `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${t.body_text}</p>`,
    // Access Code Card
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">',
    '<tr>',
    '<td align="center">',
    '<div style="background:linear-gradient(135deg,#3b82f6 0%,#14b8a6 100%);padding:3px;border-radius:12px;display:inline-block;">',
    '<div style="background-color:#ffffff;padding:24px 48px;border-radius:10px;">',
    '<p style="margin:0 0 8px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Your Access Code</p>',
    `<span style="font-size:36px;font-weight:700;letter-spacing:6px;color:#1e293b;font-family:monospace;">${accessCode}</span>`,
    '</div>',
    '</div>',
    '</td>',
    '</tr>',
    '</table>',
    `<p style="margin:0 0 24px 0;color:#64748b;font-size:14px;text-align:center;">Valid until <strong>${expiresFormatted}</strong></p>`,
    // CTA Button
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td align="center" style="padding:8px 0 24px 0;">',
    `<a href="${portalUrl}" style="display:inline-block;background:${buttonGradient};color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:${buttonShadow};">${t.button_text || 'Access Investor Portal'} →</a>`,
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    // Footer
    '<tr>',
    `<td style="background-color:${t.footer_bg_color};padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">`,
    `<p style="margin:0 0 12px 0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text || ''}</p>`,
    `<p style="margin:0;font-size:12px;color:#94a3b8;">© ${currentYear} AlfredAI. All rights reserved.</p>`,
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('');

  return html;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
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
      auth: {
        username: gmailUser,
        password: gmailPassword,
      },
    },
  });

  try {
    await client.send({
      from: `alfred ai Investor Relations <${gmailUser}>`,
      to,
      subject,
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html: html,
    });
    console.log(`Approval email sent to ${to}`);
  } finally {
    await client.close();
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { investorId, admin_notes, resend: isResend }: ApproveRequest = await req.json();

    if (!investorId) {
      return new Response(
        JSON.stringify({ error: "Investor ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require admin authorization — endpoint must never run unauthenticated.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization required" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired session" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();
    if (!roleRow) {
      return new Response(
        JSON.stringify({ success: false, error: "Admin role required" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    const adminUserId: string = user.id;

    // Fetch investor
    const { data: investor, error: fetchError } = await supabase
      .from("investor_leads")
      .select("*")
      .eq("id", investorId)
      .single();

    if (fetchError || !investor) {
      return new Response(
        JSON.stringify({ error: "Investor not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let accessCode: string;
    let expiresAt: Date;

    // Handle resend or already approved
    if (isResend && investor.status === "approved" && investor.access_code) {
      accessCode = investor.access_code;
      expiresAt = new Date(investor.access_code_expires_at);
    } else if (investor.status === "approved" && investor.access_code && !isResend) {
      return new Response(
        JSON.stringify({ success: true, message: "Investor already approved", access_code: investor.access_code }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      // Generate new access code
      accessCode = generateAccessCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from("investor_leads")
          .select("id")
          .eq("access_code", accessCode)
          .maybeSingle();
        if (!existing) break;
        accessCode = generateAccessCode();
        attempts++;
      }

      // Set expiry to 12 months
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 12);

      // Update investor record
      const { error: updateError } = await supabase
        .from("investor_leads")
        .update({
          status: "approved",
          access_code: accessCode,
          access_code_expires_at: expiresAt.toISOString(),
          reviewed_by: adminUserId,
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes || null
        })
        .eq("id", investorId);

      if (updateError) {
        console.error("Error updating investor:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to approve investor" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Fetch email template from database
    const template = await getEmailTemplate(supabase, "investor-approval");
    
    const firstName = investor.full_name?.split(" ")[0] || "Investor";
    const expiresFormatted = expiresAt.toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });
    const portalUrl = PAGE_URLS.investors;

    // Build and send email
    const emailHtml = buildApprovalEmail(
      template,
      firstName,
      accessCode,
      expiresFormatted,
      portalUrl,
      isResend || false
    );

    const emailSubject = isResend ? `${template.subject} (Resent)` : template.subject;
    await sendEmail(investor.email, emailSubject, emailHtml);

    console.log(`Investor ${investorId} approved with code ${accessCode}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isResend ? "Access code resent" : "Investor approved", 
        access_code: accessCode, 
        expires_at: expiresAt.toISOString() 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("approve-investor-access: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to approve investor" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
