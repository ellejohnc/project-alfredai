import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, SALES_EMAIL, LEAD_ALERT_RECIPIENTS, PAGE_URLS, ghlContactUrl } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_URL = PAGE_URLS.admin;

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

interface LeadNotificationRequest {
  lead_email: string;
  lead_name?: string;
  lead_phone?: string;
  lead_company?: string;
  source_page: string;
  source_medium: string;
  source_campaign?: string;
  lead_source?: string;
  traffic_source?: string;
  utm_data?: Record<string, string | undefined>;
  client?: string;
  form_name?: string;
  form_id?: string;
  campaign_id?: string;
  ad_id?: string;
  // Event type drives the banner/subject: new_lead (default), synced, sync_failed
  event?: 'new_lead' | 'synced' | 'sync_failed' | 'booking_abandoned';
  // One-click manual-book link (rendered as "Book the Meeting" button)
  manual_book_url?: string;
  // Attribution — "what made them click"
  referrer?: string;
  source_url?: string;
  tags?: string[];
  // GHL pipeline placement (for synced/confirmed events)
  pipeline_name?: string;
  pipeline_stage_name?: string;
  // Genuine sync error text (sync_failed event)
  sync_error?: string;
  // Recovery flag — previously failed, now synced
  recovered?: boolean;
  // Deep-link targets
  record_id?: string;        // ghl_submissions.id or leads.id — opens the exact record in admin
  record_type?: 'ghl_submission' | 'meta_lead' | 'lead';
  ghl_contact_id?: string;   // GoHighLevel contact id — enables "View in GHL" button
  ghl_location_id?: string;  // Optional override for the GHL sub-account
}


// deno-lint-ignore no-explicit-any
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

function formatSourceLabel(source: string): string {
  const sourceMap: Record<string, string> = {
    'chatbot': 'AI Chatbot',
    'lead_chatbot': 'AI Chatbot',
    'calendar_widget': 'Booking Calendar',
    'header_cta': 'Header CTA',
    'signup_page': 'Get Started Page',
    'page_cta': 'Page CTA',
    'booking_modal': 'Booking Modal',
    'personalization_flow': 'Qualification Flow',
    'lead_form': 'Contact Form',
    'form': 'Contact Form',
  };
  return sourceMap[source] || source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Escape untrusted lead-submitted text before HTML interpolation to prevent
// markup/link injection inside internal notification emails.
function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return '';
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildLeadNotificationEmail(
  t: EmailTemplate,
  lead: LeadNotificationRequest,
  timestamp: string
): string {
  const leadName = esc(lead.lead_name || 'Unknown');
  const leadEmail = esc(lead.lead_email);
  const leadPhone = esc(lead.lead_phone || 'Not provided');
  const leadCompany = esc(lead.lead_company || 'Not provided');
  const sourcePage = esc(lead.source_page === '/' ? 'Homepage' : lead.source_page);
  const sourceLabel = esc(formatSourceLabel(lead.source_medium || lead.lead_source || 'website'));
  const trafficSource = esc(lead.traffic_source || 'Direct');
  const utmCampaign = lead.utm_data?.utm_campaign ? esc(lead.utm_data.utm_campaign) : null;
  const clientLabel = lead.client ? esc(lead.client) : null;
  const formLabel = lead.form_name ? esc(lead.form_name) : null;
  const formId = lead.form_id ? esc(lead.form_id) : null;
  const campaignId = lead.campaign_id ? esc(lead.campaign_id) : null;
  const adId = lead.ad_id ? esc(lead.ad_id) : null;

  // Event + attribution
  const event = lead.event || 'new_lead';
  const referrer = esc(lead.referrer && lead.referrer.trim() ? lead.referrer : 'Direct (no referrer)');
  const sourceUrl = lead.source_url && lead.source_url.trim() ? esc(lead.source_url) : null;
  const tagList = (Array.isArray(lead.tags) ? lead.tags.filter(Boolean) : []).map((tg) => esc(tg));
  const pipelineName = lead.pipeline_name ? esc(lead.pipeline_name) : null;
  const pipelineStage = lead.pipeline_stage_name ? esc(lead.pipeline_stage_name) : null;
  const syncError = lead.sync_error ? esc(lead.sync_error) : null;
  const recovered = lead.recovered === true;


  // Route the "View in Admin" button to the list where this lead actually lives.
  // Meta (Facebook/Instagram) Lead Ads land in the Meta Leads page, not GHL submissions.
  const isMetaLead =
    (lead.lead_source || lead.source_medium) === 'meta_lead_ads' ||
    lead.traffic_source === 'Facebook' ||
    lead.traffic_source === 'Instagram';
  const adminLeadPath =
    lead.record_type === 'meta_lead' || isMetaLead
      ? '/meta-leads'
      : lead.record_type === 'lead'
        ? '/leads'
        : '/ghl-submissions';

  // Deep-link straight to the record when we know its id.
  const recordId = lead.record_id && lead.record_id.trim() ? lead.record_id.trim() : null;
  const adminHref = recordId
    ? `${ADMIN_URL}${adminLeadPath}?record=${encodeURIComponent(recordId)}`
    : `${ADMIN_URL}${adminLeadPath}`;

  // Direct link into GoHighLevel when we have the contact id.
  const ghlContactId = lead.ghl_contact_id && lead.ghl_contact_id.trim() ? lead.ghl_contact_id.trim() : null;
  const ghlHref = ghlContactId ? ghlContactUrl(ghlContactId, lead.ghl_location_id || undefined) : null;

  // One-click manual-book link (abandoned-booking alerts)
  const manualBookUrl = lead.manual_book_url && lead.manual_book_url.trim() ? lead.manual_book_url.trim() : null;

  // Helper to build an optional detail row only when a value is present
  const optionalRow = (label: string, value: string | null, opts?: { mono?: boolean }) =>
    value
      ? [
          '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
          '<tr>',
          `<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">${label}</td>`,
          `<td style="font-size:${opts?.mono ? '12px;font-family:monospace' : '14px'};color:#1e293b;word-break:break-all;">${value}</td>`,
          '</tr>',
          '</table>',
        ].join('')
      : '';

  if (t.use_custom_html && t.custom_html) {
    return t.custom_html
      .replace(/{{lead_name}}/g, leadName)
      .replace(/{{lead_email}}/g, leadEmail)
      .replace(/{{lead_phone}}/g, leadPhone)
      .replace(/{{lead_company}}/g, leadCompany)
      .replace(/{{source}}/g, sourceLabel)
      .replace(/{{source_page}}/g, sourcePage)
      .replace(/{{timestamp}}/g, timestamp)
      .replace(/{{admin_url}}/g, adminHref)
      .replace(/{{ghl_url}}/g, ghlHref || '');
  }

  // Build HTML without trailing spaces or line breaks that cause =20 encoding issues
  const headerGradient = `linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%)`;
  const buttonGradient = `linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%)`;
  // Event-aware banner: green (new/synced), red (failure).
  const alertGradient = event === 'sync_failed'
    ? 'linear-gradient(135deg,#ef4444 0%,#b91c1c 100%)'
    : event === 'booking_abandoned'
      ? 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)'
      : 'linear-gradient(135deg,#10b981 0%,#059669 100%)';
  const bannerText = event === 'sync_failed'
    ? `⚠️ Lead Sync FAILED — ${sourceLabel}`
    : event === 'booking_abandoned'
      ? '⚠️ Booking started — not completed'
      : event === 'synced'
        ? `${recovered ? '♻️ Recovered &amp; Synced' : '✅ Lead Synced to GHL'} — ${sourceLabel}`
        : `🎉 New Lead from ${sourceLabel}`;
  const buttonShadow = `0 4px 14px ${t.button_bg_start}44`;
  
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>New Lead Notification</title>',
    '</head>',
    `<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">`,
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;">',
    '<tr>',
    '<td style="padding:48px 24px;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">',
    // Header
    '<tr>',
    `<td style="background:${headerGradient};border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">`,
    `<img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 12px auto;height:40px;width:auto;max-width:180px;">`,
    `<h1 style="margin:0;font-size:22px;font-weight:700;color:${t.heading_color};">${t.heading}</h1>`,
    '</td>',
    '</tr>',
    // Body
    '<tr>',
    `<td style="background-color:${t.body_bg_color};padding:32px 40px;">`,
    // Alert Banner
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">',
    '<tr>',
    `<td style="background:${alertGradient};border-radius:8px;padding:16px 20px;text-align:center;">`,
    `<p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;">${bannerText}</p>`,
    '</td>',
    '</tr>',
    '</table>',
    // Intro paragraph from template body_text (structured mode)
    t.body_text && t.body_text.trim()
      ? `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${t.text_color};">${t.body_text.replace(/{{lead_name}}/g, leadName).replace(/{{source}}/g, sourceLabel)}</p>`
      : '',
    // Lead Details Card

    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:24px;">',
    '<tr>',
    '<td style="padding:24px;">',
    '<h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#1e293b;">Lead Information</h2>',
    // Name row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Name</td>',
    `<td style="font-size:14px;color:#1e293b;font-weight:600;">${leadName}</td>`,
    '</tr>',
    '</table>',
    // Email row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Email</td>',
    `<td style="font-size:14px;color:#3b82f6;"><a href="mailto:${leadEmail}" style="color:#3b82f6;text-decoration:none;">${leadEmail}</a></td>`,
    '</tr>',
    '</table>',
    // Phone row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Phone</td>',
    `<td style="font-size:14px;color:#1e293b;">${leadPhone}</td>`,
    '</tr>',
    '</table>',
    // Company row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Company</td>',
    `<td style="font-size:14px;color:#1e293b;">${leadCompany}</td>`,
    '</tr>',
    '</table>',
    // Optional client + form rows (Meta / injected leads)
    optionalRow('Client', clientLabel),
    optionalRow('Form', formLabel),
    optionalRow('Form ID', formId, { mono: true }),
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:16px 0;">',
    '<tr>',
    '<td style="border-top:1px solid #e2e8f0;"></td>',
    '</tr>',
    '</table>',
    // Source row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Source</td>',
    `<td style="font-size:14px;color:#1e293b;">${sourceLabel}</td>`,
    '</tr>',
    '</table>',
    // Traffic Source row (Facebook, Google, Direct, etc.)
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Traffic</td>',
    `<td style="font-size:14px;color:#1e293b;font-weight:600;">${trafficSource === 'Facebook' ? '📘 ' : trafficSource === 'Google Ads' ? '🔍 ' : trafficSource === 'Google (Organic)' ? '🌐 ' : trafficSource === 'Direct' ? '🔗 ' : ''}${trafficSource}${utmCampaign ? ` (${utmCampaign})` : ''}</td>`,
    '</tr>',
    '</table>',
    // Optional campaign + ad rows (Meta leads)
    optionalRow('Campaign ID', campaignId, { mono: true }),
    optionalRow('Ad ID', adId, { mono: true }),
    // Page row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Page</td>',
    `<td style="font-size:14px;color:#1e293b;">${sourcePage}</td>`,
    '</tr>',
    '</table>',
    // Timestamp row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;">Captured</td>',
    `<td style="font-size:14px;color:#1e293b;">${timestamp}</td>`,
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    // ===== "What Made Them Click" attribution card =====
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f0f9ff;border-radius:12px;border:1px solid #bae6fd;margin-bottom:24px;">',
    '<tr>',
    '<td style="padding:24px;">',
    '<h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#0c4a6e;">🔍 What Made Them Click</h2>',
    optionalRow('Origin page', sourcePage),
    optionalRow('Channel', sourceLabel),
    optionalRow('Referrer', referrer),
    optionalRow('Full URL', sourceUrl, { mono: true }),
    tagList.length
      ? [
          '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:8px;">',
          '<tr>',
          '<td width="120" style="font-size:13px;color:#64748b;font-weight:500;vertical-align:top;">Tags</td>',
          '<td>',
          tagList
            .map(
              (tag) =>
                `<span style="display:inline-block;background:#e0f2fe;color:#0369a1;font-size:12px;font-weight:500;padding:3px 10px;border-radius:9999px;margin:0 6px 6px 0;">${tag}</span>`,
            )
            .join(''),
          '</td>',
          '</tr>',
          '</table>',
        ].join('')
      : '',
    '</td>',
    '</tr>',
    '</table>',
    // ===== GHL pipeline placement card (synced events) =====
    pipelineName
      ? [
          '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-bottom:24px;">',
          '<tr>',
          '<td style="padding:24px;">',
          '<h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#166534;">📊 Pipeline Placement</h2>',
          optionalRow('Pipeline', pipelineName),
          optionalRow('Stage', pipelineStage),
          '</td>',
          '</tr>',
          '</table>',
        ].join('')
      : '',
    // ===== Sync error card (failure events) =====
    syncError
      ? [
          '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#fef2f2;border-radius:12px;border:1px solid #fecaca;margin-bottom:24px;">',
          '<tr>',
          '<td style="padding:24px;">',
          '<h2 style="margin:0 0 12px 0;font-size:18px;font-weight:600;color:#991b1b;">⚠️ Sync Error</h2>',
          `<p style="margin:0;font-size:13px;color:#7f1d1d;font-family:monospace;word-break:break-word;">${syncError}</p>`,
          '<p style="margin:12px 0 0 0;font-size:13px;color:#7f1d1d;">This lead did NOT sync to GHL. Please follow up manually so it is not missed.</p>',
          '</td>',
          '</tr>',
          '</table>',
        ].join('')
      : '',
    // CTA Buttons
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td style="text-align:center;padding:8px 0;">',
    `<a href="${adminHref}" style="display:inline-block;background:${buttonGradient};color:${t.button_text_color};text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:${buttonShadow};margin:6px;">${t.button_text || 'View in Admin'}</a>`,
    ghlHref
      ? `<a href="${ghlHref}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 14px #f59e0b44;margin:6px;">View in GHL</a>`
      : '',
    manualBookUrl
      ? `<a href="${manualBookUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;box-shadow:0 4px 14px #10b98144;margin:6px;">Book the Meeting</a>`
      : '',
    '</table>',
    '</td>',
    '</tr>',
    // Footer
    '<tr>',
    `<td style="background-color:${t.footer_bg_color};padding:20px 40px;text-align:center;border-radius:0 0 16px 16px;">`,
    `<p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">${t.footer_text || 'This is an automated notification from AlfredAI.'}</p>`,
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

const defaultTemplate: EmailTemplate = {
  subject: 'New Lead: {{lead_name}} from {{source}}',
  heading: 'New Lead Alert',
  body_text: 'A new lead has been captured from the AlfredAI website.',
  button_text: 'View in Admin',
  footer_text: 'This is an automated notification from AlfredAI.',
  custom_html: null,
  use_custom_html: false,
  ...defaultColors,
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const leadData: LeadNotificationRequest = await req.json();
    
    if (!leadData.lead_email) {
      throw new Error("Lead email is required");
    }

    console.log(`Sending new lead notification for: ${leadData.lead_email}`);

    // Get email template
    const template = await getEmailTemplate(supabase, "new_lead_notification") || defaultTemplate;

    // Format timestamp
    const timestamp = new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // Build email content
    const leadName = leadData.lead_name || 'Unknown';
    const sourceLabel = formatSourceLabel(leadData.source_medium || leadData.lead_source || 'website');
    const event = leadData.event || 'new_lead';
    const baseSubject = template.subject
      .replace(/{{lead_name}}/g, leadName)
      .replace(/{{source}}/g, sourceLabel);
    const subject =
      event === 'sync_failed'
        ? `⚠️ Lead Sync FAILED: ${leadName} (${sourceLabel})`
        : event === 'booking_abandoned'
          ? `⚠️ Booking started — not completed: ${leadName}`
          : event === 'synced'
            ? `${leadData.recovered ? '♻️ Recovered & Synced' : '✅ Lead Synced'}: ${leadName} (${sourceLabel})`
            : baseSubject;

    const html = buildLeadNotificationEmail(template, leadData, timestamp);

    // Send email to every configured lead-alert recipient
    const recipients = LEAD_ALERT_RECIPIENTS.length > 0 ? LEAD_ALERT_RECIPIENTS : [SALES_EMAIL];
    for (const recipient of recipients) {
      try {
        await sendEmail(recipient, subject, html);
      } catch (sendErr) {
        console.error(`Failed to send lead notification to ${recipient}:`, sendErr);
      }

      // Log the email send
      try {
        await supabase.from("email_logs").insert({
          template_key: "new_lead_notification",
          recipient_email: recipient,
          subject,
          status: "sent",
          function_name: "notify-new-lead",
          metadata: {
            lead_email: leadData.lead_email,
            lead_name: leadData.lead_name,
            source: sourceLabel,
            client: leadData.client ?? null,
            form_name: leadData.form_name ?? null,
            form_id: leadData.form_id ?? null,
            campaign_id: leadData.campaign_id ?? null,
            ad_id: leadData.ad_id ?? null,
            traffic_source: leadData.traffic_source ?? null,
          },
        });
      } catch (logError) {
        console.error("Failed to log email send:", logError);
      }
    }

    console.log(`Lead notification (${event}) sent to ${recipients.join(", ")} for lead: ${leadData.lead_email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Lead notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in notify-new-lead:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
