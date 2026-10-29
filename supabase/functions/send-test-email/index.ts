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

async function logEmailSend(
  supabase: any,
  templateKey: string,
  recipientEmail: string,
  subject: string,
  status: 'sent' | 'failed',
  sentBy: string | null,
  errorMessage?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await supabase.from("email_logs").insert({
      template_key: templateKey,
      recipient_email: recipientEmail,
      subject,
      status,
      error_message: errorMessage || null,
      metadata: metadata || {},
      sent_by: sentBy,
      function_name: 'send-test-email',
    });
  } catch (err) {
    console.error("Failed to log email send:", err);
  }
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
    console.log(`Test email sent successfully to ${to}`);
  } finally {
    await client.close();
  }

  return { success: true };
}

function buildTestEmail(t: EmailTemplate, testData: Record<string, string>): string {
  // If using custom HTML, apply variable substitution
  if (t.use_custom_html && t.custom_html) {
    let html = t.custom_html;
    Object.entries(testData).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });
    return html;
  }

  // Build standard email template with all the styling
  let bodyText = t.body_text;
  Object.entries(testData).forEach(([key, value]) => {
    bodyText = bodyText.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });

  let heading = t.heading;
  Object.entries(testData).forEach(([key, value]) => {
    heading = heading.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;font-weight:500;">${heading}</p></td></tr><tr><td style="background-color:${t.body_bg_color};padding:40px;"><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">${bodyText}</p>${t.button_text ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="text-align:center;padding:24px 0;"><a href="#" style="display:inline-block;background:linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%);color:${t.button_text_color};text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px ${t.button_bg_start}66;">${t.button_text}</a></td></tr></table>` : ''}</td></tr>${t.footer_text ? `<tr><td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text}</p></td></tr>` : ''}<tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Intelligent Business Automation</p><p style="margin:8px 0 0 0;font-size:11px;color:#cbd5e1;font-style:italic;">This is a test email from the Email Template Editor</p></td></tr></table></td></tr></table></body></html>`;
}

// Default templates for fallback
const defaultTemplates: Record<string, EmailTemplate> = {
  invite: {
    subject: "You're Invited to Join AlfredAI Admin",
    heading: "You're Invited!",
    body_text: "You've been invited to join the AlfredAI admin panel. Click the button below to set up your account.",
    button_text: "Accept Invitation",
    footer_text: "This invitation will expire in 7 days.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  credentials: {
    subject: "Your AlfredAI Login Credentials",
    heading: "Welcome to AlfredAI",
    body_text: "Your admin account has been created. Please change your password after first login.",
    button_text: "Login Now",
    footer_text: "Keep these credentials secure.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'password-reset': {
    subject: "Reset Your AlfredAI Password",
    heading: "Password Reset Request",
    body_text: "We received a request to reset your password. Click the button below to create a new password.",
    button_text: "Reset Password",
    footer_text: "If you didn't request this, you can safely ignore this email.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'guide-access': {
    subject: "Your Guide is Ready",
    heading: "Your Download is Ready!",
    body_text: "Thank you for your interest! Click the button below to access your guide.",
    button_text: "Download Guide",
    footer_text: "We hope you find this resource valuable.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  registration: {
    subject: "Registration Confirmed",
    heading: "You're Registered!",
    body_text: "Thank you for registering! We're excited to have you join us.",
    button_text: "Add to Calendar",
    footer_text: "We look forward to seeing you!",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  reminder: {
    subject: "Event Reminder",
    heading: "Event Starting Soon!",
    body_text: "This is a friendly reminder about your upcoming event.",
    button_text: "Join Event",
    footer_text: "See you there!",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-approval': {
    subject: "Your AlfredAI Investor Portal Access Code",
    heading: "Access Approved",
    body_text: "Your request to access the AlfredAI Investor Portal has been approved.",
    button_text: "Access Investor Portal",
    footer_text: "This access code is valid for 12 months.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-rejection': {
    subject: "Update on Your AlfredAI Investor Access Request",
    heading: "Thank You for Your Interest",
    body_text: "Thank you for your interest in AlfredAI. We are unable to provide investor portal access at this time.",
    button_text: null,
    footer_text: "If you have questions, please contact us.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-booking-scheduled': {
    subject: "New Investor Meeting Scheduled",
    heading: "Meeting Scheduled",
    body_text: "Your investor meeting has been scheduled. We look forward to speaking with you.",
    button_text: "View Meeting Details",
    footer_text: "Add this to your calendar.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-booking-canceled': {
    subject: "Investor Meeting Canceled",
    heading: "Meeting Canceled",
    body_text: "Your scheduled investor meeting has been canceled.",
    button_text: "Reschedule Meeting",
    footer_text: "We hope to connect with you soon.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-booking-noshow': {
    subject: "Investor No-Show",
    heading: "No-Show Recorded",
    body_text: "We noticed you were unable to attend the scheduled investor meeting.",
    button_text: "Reschedule Meeting",
    footer_text: "Please reschedule at your convenience.",
    custom_html: null,
    use_custom_html: false,
    ...defaultColors,
  },
  'investor-request-notification': {
    subject: "🔔 New Investor Access Request",
    heading: "New Investor Access Request",
    body_text: "A new investor has submitted an access request for the Investor Portal.",
    button_text: "Review in Admin Panel",
    footer_text: "This is an automated notification from AlfredAI.",
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
  },
  'new_lead_notification': {
    subject: "🎯 New Lead: {{lead_name}} from {{source}}",
    heading: "New Lead Alert",
    body_text: "A new lead has been captured through the AlfredAI website. Review the details below and follow up promptly.",
    button_text: "View in Admin",
    footer_text: "This is an automated notification from AlfredAI.",
    custom_html: null,
    use_custom_html: false,
    header_bg_start: '#059669',
    header_bg_end: '#047857',
    button_bg_start: '#3b82f6',
    button_bg_end: '#2563eb',
    body_bg_color: '#ffffff',
    footer_bg_color: '#f1f5f9',
    text_color: '#475569',
    heading_color: '#ffffff',
    button_text_color: '#ffffff',
  },
};

interface TestEmailRequest {
  templateKey: string;
  recipientEmail: string;
  testData?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let userId: string | null = null;

  try {
    // Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    userId = user.id;

    const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!roleData || !["admin", "super_admin"].includes(roleData.role)) {
      throw new Error("Only admins can send test emails");
    }

    const { templateKey, recipientEmail, testData = {} }: TestEmailRequest = await req.json();
    
    if (!templateKey) throw new Error("Template key is required");
    if (!recipientEmail) throw new Error("Recipient email is required");

    console.log(`Sending test email for template: ${templateKey} to: ${recipientEmail}`);

    // Fetch template from DB or use default
    let template = await getEmailTemplate(supabase, templateKey);
    if (!template) {
      template = defaultTemplates[templateKey];
      if (!template) {
        // Create a generic template for unknown keys
        const humanizedName = templateKey.replace(/[-_]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
        template = {
          subject: `Test: ${humanizedName}`,
          heading: humanizedName,
          body_text: `This is a test email for the "${humanizedName}" template. Customize this template in the admin panel.`,
          button_text: "Learn More",
          footer_text: "This is a test email.",
          custom_html: null,
          use_custom_html: false,
          ...defaultColors,
        };
      }
    }

    // Apply test data to subject
    let subject = template.subject;
    Object.entries(testData).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });
    subject = `[TEST] ${subject}`;

    const html = buildTestEmail(template, testData);
    await sendEmail(recipientEmail, subject, html);

    // Log the successful send
    await logEmailSend(supabase, templateKey, recipientEmail, subject, 'sent', userId, undefined, { testData, isTest: true });

    return new Response(
      JSON.stringify({ success: true, message: `Test email sent to ${recipientEmail}` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-test-email:", error);

    // Log the failed send
    if (userId) {
      const body = await req.clone().json().catch(() => ({}));
      await logEmailSend(
        supabase,
        body.templateKey || 'unknown',
        body.recipientEmail || 'unknown',
        'Test Email',
        'failed',
        userId,
        error.message,
        { isTest: true }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
