import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { PAGE_URLS, LOGO_URL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvestorData {
  fullName: string;
  email: string;
  firmName: string;
  role: string;
  investmentFocus: string;
  typicalCheckSize: string;
  interestReason: string;
  socialProfileUrl: string;
  phoneNumber: string;
}

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

const defaultTemplate: EmailTemplate = {
  subject: '🔔 New Investor Access Request: {{investorName}} from {{firmName}}',
  heading: 'New Investor Access Request',
  body_text: 'A new investor has submitted an access request for the Investor Portal. Please review and approve or reject from the admin panel.',
  button_text: 'Review in Admin Panel',
  footer_text: 'This is an automated notification from AlfredAI Investor Relations.',
  custom_html: null,
  use_custom_html: false,
  header_bg_start: '#dc2626',
  header_bg_end: '#991b1b',
  button_bg_start: '#3b82f6',
  button_bg_end: '#2563eb',
  body_bg_color: '#ffffff',
  footer_bg_color: '#f1f5f9',
  text_color: '#475569',
  heading_color: '#ffffff',
  button_text_color: '#ffffff',
};

function replacePlaceholders(text: string, data: InvestorData): string {
  return text
    .replace(/\{\{investorName\}\}/g, data.fullName)
    .replace(/\{\{firmName\}\}/g, data.firmName)
    .replace(/\{\{email\}\}/g, data.email)
    .replace(/\{\{role\}\}/g, data.role)
    .replace(/\{\{investmentFocus\}\}/g, data.investmentFocus || 'Not specified')
    .replace(/\{\{checkSize\}\}/g, data.typicalCheckSize || 'Not specified')
    .replace(/\{\{interestReason\}\}/g, data.interestReason || '')
    .replace(/\{\{socialProfile\}\}/g, data.socialProfileUrl || '')
    .replace(/\{\{phoneNumber\}\}/g, data.phoneNumber || '');
}

function buildEmailHtml(template: EmailTemplate, investorData: InvestorData): string {
  const heading = replacePlaceholders(template.heading, investorData);
  const bodyText = replacePlaceholders(template.body_text, investorData);
  const footerText = replacePlaceholders(template.footer_text || '', investorData);

  // If custom HTML is enabled and provided, use it with placeholder replacement
  if (template.use_custom_html && template.custom_html) {
    return replacePlaceholders(template.custom_html, investorData);
  }

  // Build HTML without excessive indentation to prevent Quoted-Printable =20 encoding artifacts
  const socialProfileHtml = investorData.socialProfileUrl
    ? `<p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Social Profile:</strong> <a href="${investorData.socialProfileUrl}" target="_blank" style="color:#2563eb;">${investorData.socialProfileUrl}</a></p>`
    : '';
  const phoneHtml = investorData.phoneNumber
    ? `<p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Phone:</strong> ${investorData.phoneNumber}</p>`
    : '';
  const interestHtml = investorData.interestReason
    ? `<div style="margin-bottom:24px;"><p style="margin:0 0 8px 0;font-size:14px;color:#334155;font-weight:600;">Interest in AlfredAI:</p><p style="margin:0;padding:12px;background-color:#f1f5f9;border-radius:6px;font-size:14px;color:#475569;font-style:italic;">"${investorData.interestReason}"</p></div>`
    : '';
  const buttonHtml = template.button_text
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center"><a href="${PAGE_URLS.adminInvestors}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,${template.button_bg_start} 0%,${template.button_bg_end} 100%);color:${template.button_text_color};text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">${template.button_text} &rarr;</a></td></tr></table>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#f8fafc;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:40px 20px;"><tr><td><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,${template.header_bg_start} 0%,${template.header_bg_end} 100%);border-radius:12px 12px 0 0;padding:24px;"><tr><td align="center"><img src="${LOGO_URL}" alt="AlfredAI" width="48" height="48" style="display:block;margin-bottom:12px;"><h1 style="margin:0;color:${template.heading_color};font-size:20px;font-weight:600;">${heading}</h1></td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${template.body_bg_color};padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;"><tr><td><p style="margin:0 0 20px 0;color:${template.text_color};font-size:16px;line-height:1.6;">${bodyText}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;"><tr><td><p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Name:</strong> ${investorData.fullName}</p><p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Email:</strong> <a href="mailto:${investorData.email}" style="color:#2563eb;">${investorData.email}</a></p><p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Firm:</strong> ${investorData.firmName}</p><p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Role:</strong> ${investorData.role}</p><p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Investment Focus:</strong> ${investorData.investmentFocus || 'Not specified'}</p><p style="margin:0 0 12px 0;font-size:14px;color:#64748b;"><strong style="color:#334155;">Check Size:</strong> ${investorData.typicalCheckSize || 'Not specified'}</p>${socialProfileHtml}${phoneHtml}</td></tr></table>${interestHtml}${buttonHtml}</td></tr></table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${template.footer_bg_color};padding:20px 32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;"><tr><td align="center"><p style="margin:0;color:#64748b;font-size:12px;">${footerText}</p></td></tr></table></td></tr></table></body></html>`;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-investor-request: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const investorData: InvestorData = await req.json();
    console.log("notify-investor-request: Processing notification for:", investorData.fullName);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch email template from database
    const { data: templateData, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", "investor-request-notification")
      .single();

    if (templateError) {
      console.warn("notify-investor-request: Could not fetch template, using default:", templateError);
    }

    const template: EmailTemplate = templateData || defaultTemplate;
    console.log("notify-investor-request: Using template:", template.subject);

    // Get superadmin and admin emails from user_roles
    const { data: admins, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .in("role", ["super_admin", "admin"]);

    if (rolesError) {
      console.error("notify-investor-request: Error fetching admins:", rolesError);
    }

    // Get admin user details
    let adminEmails: string[] = [];
    if (admins && admins.length > 0) {
      const userIds = admins.map(a => a.user_id);
      const { data: adminUsers, error: usersError } = await supabase
        .from("admin_users")
        .select("email")
        .in("id", userIds);
      
      if (adminUsers) {
        adminEmails = adminUsers.map(u => u.email);
      }
      if (usersError) {
        console.error("notify-investor-request: Error fetching admin users:", usersError);
      }
    }

    // Fallback if no admins found
    if (adminEmails.length === 0) {
      console.warn("notify-investor-request: No admin emails found, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No admin emails configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("notify-investor-request: Sending to admins:", adminEmails);

    const emailSubject = replacePlaceholders(template.subject, investorData);
    const emailHtml = buildEmailHtml(template, investorData);

    // Send email via Gmail SMTP
    const client = new SMTPClient({
      connection: {
        hostname: "smtp.gmail.com",
        port: 465,
        tls: true,
        auth: {
          username: Deno.env.get("GMAIL_USER")!,
          password: Deno.env.get("GMAIL_APP_PASSWORD")!,
        },
      },
    });

    try {
      await client.send({
        from: `alfred ai Investor Relations <${Deno.env.get("GMAIL_USER")!}>`,
        to: adminEmails,
        subject: emailSubject,
        content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
        html: emailHtml,
      });
    } finally {
      await client.close();
    }

    console.log("notify-investor-request: Email sent successfully to:", adminEmails);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent to admins" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("notify-investor-request: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
