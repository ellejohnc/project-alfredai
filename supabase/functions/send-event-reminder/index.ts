import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, getUnsubscribeUrl } from "../_shared/config.ts";
import { isInternalCaller, forbiddenResponse, escapeHtml } from "../_shared/requestGuards.ts";

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

function buildReminderEmail(t: EmailTemplate, recipientName: string, eventTitle: string, formattedDate: string, eventDescription: string | undefined, recipientEmail: string): string {
  const unsubscribeUrl = getUnsubscribeUrl(recipientEmail);
  
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html
      .replace(/{{recipientName}}/g, recipientName)
      .replace(/{{eventTitle}}/g, eventTitle)
      .replace(/{{formattedDate}}/g, formattedDate)
      .replace(/{{eventDescription}}/g, eventDescription || '')
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);
  }
  
  const descriptionHtml = eventDescription ? `<p style="margin:12px 0 0 0;font-size:14px;color:#64748b;line-height:1.5;">${eventDescription}</p>` : '';
  const unsubscribeFooter = `<tr><td style="background-color:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0;"><a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;text-decoration:underline;">Unsubscribe from our emails</a></td></tr>`;
  
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head><body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;"><tr><td style="padding:48px 24px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;"><tr><td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;"><img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;" /><h1 style="margin:0 0 8px 0;font-size:28px;font-weight:700;color:${t.heading_color};">AlfredAI</h1><p style="margin:0;font-size:13px;color:${t.heading_color};opacity:0.8;text-transform:uppercase;letter-spacing:2px;">${t.heading}</p></td></tr><tr><td style="background-color:${t.body_bg_color};padding:40px;"><h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Your Event is Coming Up!</h2><p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:${t.text_color};">Hi ${recipientName || 'there'}, ${t.body_text}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;"><tr><td style="background-color:${t.footer_bg_color};border:1px solid #e2e8f0;border-left:4px solid ${t.button_bg_start};border-radius:0 12px 12px 0;padding:24px;"><h3 style="margin:0 0 12px 0;font-size:20px;font-weight:600;color:#1e293b;">${eventTitle}</h3><p style="margin:0;font-size:14px;color:${t.text_color};"><strong style="color:#64748b;">📅 When:</strong> ${formattedDate}</p>${descriptionHtml}</td></tr></table><p style="margin:0;font-size:16px;line-height:1.6;color:${t.text_color};">We look forward to seeing you there!</p><p style="margin:24px 0 0 0;font-size:14px;color:#64748b;">Best regards,<br><strong style="color:#1e293b;">The AlfredAI Team</strong></p></td></tr><tr><td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${t.footer_text || 'You received this email because you registered for an event on AlfredAI.'}</p></td></tr>${unsubscribeFooter}<tr><td style="background-color:#f8fafc;border-radius:0 0 16px 16px;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;"><p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:#1e293b;">AlfredAI</p><p style="margin:0;font-size:12px;color:#94a3b8;">Intelligent Business Automation</p></td></tr></table></td></tr></table></body></html>`;
}

const defaultTemplate: EmailTemplate = { subject: "Event Reminder", heading: "Event Reminder 🎯", body_text: "this is a friendly reminder that you're registered for:", button_text: "Join Event", footer_text: "You received this email because you registered for an event on AlfredAI.", custom_html: null, use_custom_html: false, ...defaultColors };

interface ReminderRequest { eventId: string; recipientEmail: string; recipientName: string; eventTitle: string; eventDate: string; eventDescription?: string; }

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  // Internal-only: reminders are dispatched by process-event-reminders / admin tooling.
  if (!isInternalCaller(req)) {
    console.warn("[SEND-EVENT-REMINDER] Rejected unauthenticated caller");
    return forbiddenResponse(corsHeaders);
  }
  try {
    const GMAIL_USER = Deno.env.get("GMAIL_USER");
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) throw new Error("Gmail credentials not configured");

    const { eventId, recipientEmail, recipientName, eventTitle, eventDate, eventDescription }: ReminderRequest = await req.json();
    if (!recipientEmail || !eventTitle || !eventDate) return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const template = await getEmailTemplate(supabase, "reminder") || defaultTemplate;

    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    const emailHtml = buildReminderEmail(template, escapeHtml(recipientName), escapeHtml(eventTitle), formattedDate, escapeHtml(eventDescription), recipientEmail);

    const client = new SMTPClient({ connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD } } });
    await client.send({ 
      from: `alfred ai <${GMAIL_USER}>`, 
      to: recipientEmail, 
      subject: `Reminder: ${eventTitle} is coming up!`, 
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html: emailHtml,
    });
    await client.close();

    console.log(`Reminder email sent successfully to ${recipientEmail} for event: ${eventTitle}`);
    return new Response(JSON.stringify({ success: true, message: "Reminder email sent successfully" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error sending reminder email:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};

serve(handler);
