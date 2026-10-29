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
  header_bg_start: '#64748b',
  header_bg_end: '#475569',
  button_bg_start: '#3b82f6',
  button_bg_end: '#2563eb',
  body_bg_color: '#ffffff',
  footer_bg_color: '#f1f5f9',
  text_color: '#475569',
  heading_color: '#ffffff',
  button_text_color: '#ffffff',
};

const defaultTemplate: EmailTemplate = {
  subject: "Update on Your AlfredAI Investor Access Request",
  heading: "Thank You for Your Interest",
  body_text: "We appreciate your interest in AlfredAI. After careful review, we are unable to provide investor portal access at this time. This decision does not reflect on you personally, and we encourage you to stay connected with us for future opportunities.",
  button_text: "Visit Our Website",
  footer_text: "Thank you for your understanding. — The AlfredAI Team",
  custom_html: null,
  use_custom_html: false,
  ...defaultColors
};

interface RejectRequest {
  investorId: string;
  rejectionReason: string;
  adminNotes?: string;
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

function buildRejectionEmail(
  t: EmailTemplate,
  firstName: string,
  rejectionReason: string,
  websiteUrl: string
): string {
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html
      .replace(/{{firstName}}/g, firstName)
      .replace(/{{rejectionReason}}/g, rejectionReason)
      .replace(/{{websiteUrl}}/g, websiteUrl);
  }

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
    `<title>${t.subject}</title>`,
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
    `<h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:${t.heading_color};">${t.heading}</h1>`,
    `<p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;">AlfredAI Investor Portal</p>`,
    '</td>',
    '</tr>',
    // Body
    '<tr>',
    `<td style="background-color:${t.body_bg_color};padding:40px;">`,
    `<h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Dear ${firstName},</h2>`,
    `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${t.body_text}</p>`,
    // Reason Card
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">',
    '<tr>',
    '<td style="background:#f1f5f9;border-radius:12px;padding:20px;border-left:4px solid #64748b;">',
    '<p style="margin:0 0 8px 0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Reason</p>',
    `<p style="margin:0;font-size:15px;line-height:1.5;color:#475569;">${rejectionReason}</p>`,
    '</td>',
    '</tr>',
    '</table>',
    `<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">If you believe this decision was made in error or if your circumstances have changed, please feel free to reapply or contact us directly.</p>`,
    // CTA Button
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td align="center" style="padding:8px 0 24px 0;">',
    `<a href="${websiteUrl}" style="display:inline-block;background:${buttonGradient};color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:${buttonShadow};">${t.button_text || 'Visit Our Website'}</a>`,
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
    console.log(`Rejection email sent to ${to}`);
  } finally {
    await client.close();
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { investorId, rejectionReason, adminNotes }: RejectRequest = await req.json();

    if (!investorId || !rejectionReason) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: investorId and rejectionReason" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Rejecting investor access for: ${investorId}`);

    const { data: investor, error: fetchError } = await supabaseClient
      .from("investor_leads")
      .select("*")
      .eq("id", investorId)
      .single();

    if (fetchError || !investor) {
      console.error("Error fetching investor:", fetchError);
      return new Response(
        JSON.stringify({ error: "Investor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabaseClient
      .from("investor_leads")
      .update({
        status: "rejected",
        admin_notes: adminNotes || rejectionReason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", investorId);

    if (updateError) {
      console.error("Error updating investor lead:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update investor status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch email template from database
    const template = await getEmailTemplate(supabaseClient, "investor-rejection");
    
    const firstName = investor.full_name?.split(" ")[0] || "Investor";
    const websiteUrl = PRODUCTION_URL;

    // Build and send email
    const emailHtml = buildRejectionEmail(template, firstName, rejectionReason, websiteUrl);
    await sendEmail(investor.email, template.subject, emailHtml);

    // Log activity
    try {
      await supabaseClient.from("activity_logs").insert({
        user_id: user.id,
        user_email: user.email || "",
        action: "update",
        resource_type: "investor_lead" as any,
        resource_id: investorId,
        resource_name: `Rejected: ${investor.full_name}`,
        details: { 
          rejection_reason: rejectionReason,
          investor_email: investor.email,
          investor_firm: investor.firm_name
        },
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Investor access request rejected and notification sent"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in reject-investor-access:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
