import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { LOGO_URL, PAGE_URLS } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-calendly-webhook-signature',
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

function buildBookingEmail(
  t: EmailTemplate,
  eventType: 'scheduled' | 'canceled' | 'no_show',
  investorName: string,
  investorEmail: string,
  eventName: string,
  formattedDate: string,
  formattedTime: string,
  location: string,
  cancellationReason?: string
): string {
  if (t.use_custom_html && t.custom_html) {
    return t.custom_html
      .replace(/{{investorName}}/g, investorName)
      .replace(/{{investorEmail}}/g, investorEmail)
      .replace(/{{eventName}}/g, eventName)
      .replace(/{{formattedDate}}/g, formattedDate)
      .replace(/{{formattedTime}}/g, formattedTime)
      .replace(/{{location}}/g, location)
      .replace(/{{cancellationReason}}/g, cancellationReason || '');
  }

  const statusIcon = eventType === 'scheduled' ? '✓' : eventType === 'canceled' ? '✕' : '!';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;">
    <tr>
      <td style="padding:48px 24px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${t.header_bg_start} 0%,${t.header_bg_end} 100%);border-radius:16px 16px 0 0;padding:32px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <img src="${LOGO_URL}" alt="AlfredAI" style="height:32px;width:auto;" />
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:${t.header_bg_start};border:1px solid rgba(255,255,255,0.3);color:${t.heading_color};padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;letter-spacing:0.5px;">
                      ${statusIcon} ${t.heading}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="background-color:${t.body_bg_color};padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#0f172a;">
                Investor Meeting ${eventType === 'scheduled' ? 'Scheduled' : eventType === 'canceled' ? 'Canceled' : 'No-Show'}
              </h1>
              <p style="margin:0 0 24px 0;font-size:15px;color:${t.text_color};">
                ${t.body_text}
              </p>
              
              <!-- Meeting Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom:16px;">
                          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Investor</p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${investorName}</p>
                          <p style="margin:4px 0 0 0;font-size:14px;color:#64748b;">${investorEmail}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
                          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Meeting</p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${eventName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom:16px;border-top:1px solid #e2e8f0;padding-top:16px;">
                          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Date & Time</p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${formattedDate}</p>
                          <p style="margin:4px 0 0 0;font-size:14px;color:#64748b;">${formattedTime}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top:1px solid #e2e8f0;padding-top:16px;">
                          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Location</p>
                          <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${location}</p>
                        </td>
                      </tr>
                      ${cancellationReason ? `
                      <tr>
                        <td style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:16px;">
                          <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#ef4444;text-transform:uppercase;letter-spacing:0.5px;">Cancellation Reason</p>
                          <p style="margin:0;font-size:14px;color:#64748b;font-style:italic;">"${cancellationReason}"</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <a href="${PAGE_URLS.adminInvestors}" style="display:inline-block;background:linear-gradient(135deg,${t.button_bg_start} 0%,${t.button_bg_end} 100%);color:${t.button_text_color};text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:14px;">
                      ${t.button_text || 'View in Admin Dashboard'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:${t.footer_bg_color};padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;">
                ${t.footer_text || 'This is an automated notification from AlfredAI Investor Relations.'}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendBookingNotification(
  supabase: any,
  eventType: 'scheduled' | 'canceled' | 'no_show',
  investorName: string,
  investorEmail: string,
  eventName: string,
  startTime: string,
  endTime: string,
  location: string,
  cancellationReason?: string
) {
  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');
  
  if (!gmailUser || !gmailPassword) {
    console.log('Gmail credentials not configured, skipping email notification');
    return;
  }

  // Get template based on event type
  const templateKey = eventType === 'scheduled' 
    ? 'investor-booking-scheduled' 
    : eventType === 'canceled' 
    ? 'investor-booking-canceled' 
    : 'investor-booking-noshow';
  
  const template = await getEmailTemplate(supabase, templateKey);
  
  // Fallback template if not found in DB
  const fallbackTemplate: EmailTemplate = {
    subject: eventType === 'scheduled' 
      ? `📅 New Investor Meeting: ${investorName}`
      : eventType === 'canceled'
      ? `❌ Investor Meeting Canceled: ${investorName}`
      : `⚠️ Investor No-Show: ${investorName}`,
    heading: eventType === 'scheduled' ? 'SCHEDULED' : eventType === 'canceled' ? 'CANCELED' : 'NO-SHOW',
    body_text: eventType === 'scheduled' 
      ? 'A new investor meeting has been scheduled.'
      : eventType === 'canceled'
      ? 'An investor meeting has been canceled.'
      : 'An investor did not attend their scheduled meeting.',
    button_text: 'View in Admin Dashboard',
    footer_text: 'This is an automated notification from AlfredAI Investor Relations.',
    custom_html: null,
    use_custom_html: false,
    header_bg_start: eventType === 'scheduled' ? '#10b981' : eventType === 'canceled' ? '#ef4444' : '#f59e0b',
    header_bg_end: eventType === 'scheduled' ? '#059669' : eventType === 'canceled' ? '#dc2626' : '#d97706',
    button_bg_start: defaultColors.button_bg_start,
    button_bg_end: defaultColors.button_bg_end,
    body_bg_color: defaultColors.body_bg_color,
    footer_bg_color: defaultColors.footer_bg_color,
    text_color: defaultColors.text_color,
    heading_color: defaultColors.heading_color,
    button_text_color: defaultColors.button_text_color,
  };

  const t = template || fallbackTemplate;

  const formattedDate = new Date(startTime).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = new Date(startTime).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const emailHtml = buildBookingEmail(
    t,
    eventType,
    investorName,
    investorEmail,
    eventName || 'Investor Meeting',
    formattedDate,
    formattedTime,
    location,
    cancellationReason
  );

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
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
      from: `alfred ai <${gmailUser}>`,
      to: gmailUser, // Send to admin
      subject: t.subject.includes(investorName) ? t.subject : `${t.subject}: ${investorName}`,
      html: emailHtml,
    });
    console.log('Booking notification email sent successfully');
  } catch (error) {
    console.error('Error sending booking notification email:', error);
  } finally {
    await client.close();
  }
}

interface CalendlyEvent {
  uri: string;
  name: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
  location?: {
    type: string;
    location?: string;
    join_url?: string;
  };
  invitees_counter: {
    total: number;
    active: number;
    limit: number;
  };
  created_at: string;
  updated_at: string;
  event_memberships: Array<{
    user: string;
  }>;
  event_guests: Array<{
    email: string;
    created_at: string;
    updated_at: string;
  }>;
  cancellation?: {
    canceled_by: string;
    reason: string;
    canceler_type: string;
  };
}

interface CalendlyInvitee {
  uri: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  status: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  reschedule_url: string;
  cancel_url: string;
  questions_and_answers?: Array<{
    question: string;
    answer: string;
    position: number;
  }>;
  tracking?: {
    utm_campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_content?: string;
    utm_term?: string;
    salesforce_uuid?: string;
  };
  payment?: {
    external_id: string;
    provider: string;
    amount: number;
    currency: string;
    terms: string;
    successful: boolean;
  };
  no_show?: {
    uri: string;
    created_at: string;
  };
  reconfirmation?: {
    created_at: string;
    confirmed_at?: string;
  };
  rescheduled: boolean;
  old_invitee?: string;
  new_invitee?: string;
  cancellation?: {
    canceled_by: string;
    reason: string;
    canceler_type: string;
  };
}

interface CalendlyWebhookPayload {
  event: 'invitee.created' | 'invitee.canceled' | 'invitee.no_show';
  created_at: string;
  created_by: string;
  payload: {
    event: CalendlyEvent;
    invitee: CalendlyInvitee;
    questions_and_answers?: Array<{
      question: string;
      answer: string;
      position: number;
    }>;
    tracking?: {
      utm_campaign?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_content?: string;
      utm_term?: string;
    };
    cancel_url?: string;
    reschedule_url?: string;
    no_show_uri?: string;
    scheduled_event: CalendlyEvent;
  };
}

async function verifyCalendlySignature(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  // Calendly signature header format: "t=timestamp,v1=signature"
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );
  const timestamp = parts["t"];
  const expected = parts["v1"];
  if (!timestamp || !expected) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${rawBody}`));
  const computed = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === expected;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the Calendly webhook signature before trusting the payload (fail closed).
    const rawBody = await req.text();
    const webhookSecret = Deno.env.get('CALENDLY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('CALENDLY_WEBHOOK_SECRET not configured - rejecting request');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const signatureHeader = req.headers.get('Calendly-Webhook-Signature')
      ?? req.headers.get('x-calendly-webhook-signature');
    const valid = await verifyCalendlySignature(rawBody, signatureHeader, webhookSecret);
    if (!valid) {
      console.error('Invalid Calendly webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const webhookPayload: CalendlyWebhookPayload = JSON.parse(rawBody);

    
    console.log('Received Calendly webhook:', webhookPayload.event);
    console.log('Invitee email:', webhookPayload.payload.invitee.email);

    const inviteeEmail = webhookPayload.payload.invitee.email.toLowerCase();
    const scheduledEvent = webhookPayload.payload.scheduled_event || webhookPayload.payload.event;
    
    // Extract event ID from URI
    const eventUri = scheduledEvent.uri;
    const calendlyEventId = eventUri.split('/').pop() || eventUri;
    
    const inviteeUri = webhookPayload.payload.invitee.uri;
    const calendlyInviteeId = inviteeUri.split('/').pop() || inviteeUri;

    // Find the investor by email
    const { data: investor, error: investorError } = await supabase
      .from('investor_leads')
      .select('id, full_name, email')
      .eq('email', inviteeEmail)
      .single();

    if (investorError || !investor) {
      console.log('No matching investor found for email:', inviteeEmail);
      // Still return success - we don't want Calendly to retry
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No matching investor found',
          email: inviteeEmail 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found investor:', investor.id, investor.full_name);

    // Determine booking status based on event type
    let bookingStatus = 'scheduled';
    let cancellationReason = null;

    switch (webhookPayload.event) {
      case 'invitee.created':
        bookingStatus = 'scheduled';
        break;
      case 'invitee.canceled':
        bookingStatus = 'canceled';
        cancellationReason = webhookPayload.payload.invitee.cancellation?.reason || 'No reason provided';
        break;
      case 'invitee.no_show':
        bookingStatus = 'no_show';
        break;
    }

    // Determine location
    const location = scheduledEvent.location?.join_url || 
                    scheduledEvent.location?.location || 
                    scheduledEvent.location?.type || 
                    'Virtual Meeting';

    // Check if booking already exists
    const { data: existingBooking } = await supabase
      .from('investor_bookings')
      .select('id')
      .eq('calendly_event_id', calendlyEventId)
      .single();

    if (existingBooking) {
      // Update existing booking
      const { error: updateError } = await supabase
        .from('investor_bookings')
        .update({
          status: bookingStatus,
          cancellation_reason: cancellationReason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBooking.id);

      if (updateError) {
        console.error('Error updating booking:', updateError);
        throw updateError;
      }

      console.log('Updated existing booking:', existingBooking.id);
    } else {
      // Create new booking
      const { error: insertError } = await supabase
        .from('investor_bookings')
        .insert({
          investor_id: investor.id,
          calendly_event_id: calendlyEventId,
          calendly_invitee_id: calendlyInviteeId,
          event_type: scheduledEvent.event_type,
          event_name: scheduledEvent.name,
          start_time: scheduledEvent.start_time,
          end_time: scheduledEvent.end_time,
          status: bookingStatus,
          location: location,
          cancellation_reason: cancellationReason,
        });

      if (insertError) {
        console.error('Error creating booking:', insertError);
        throw insertError;
      }

      console.log('Created new booking for investor:', investor.id);
    }

    // Update investor verification method to 'booking' if this is their first booking
    if (webhookPayload.event === 'invitee.created') {
      const { error: updateInvestorError } = await supabase
        .from('investor_leads')
        .update({ 
          verification_method: 'booking',
        })
        .eq('id', investor.id);

      if (updateInvestorError) {
        console.error('Error updating investor verification method:', updateInvestorError);
      }
    }

    // Log the activity
    await supabase
      .from('investor_code_usage')
      .insert({
        investor_id: investor.id,
        access_code: `calendly_${webhookPayload.event}`,
        is_master_code: false,
        ip_address: req.headers.get('x-forwarded-for') || 'calendly-webhook',
        user_agent: 'Calendly Webhook',
      });

    // Send email notification (as background task - don't await)
    const emailEventType = bookingStatus === 'scheduled' ? 'scheduled' : 
                          bookingStatus === 'canceled' ? 'canceled' : 'no_show';
    
    sendBookingNotification(
      supabase,
      emailEventType,
      investor.full_name,
      investor.email,
      scheduledEvent.name || 'Investor Meeting',
      scheduledEvent.start_time,
      scheduledEvent.end_time,
      location,
      cancellationReason || undefined
    ).catch(err => console.error('Background email error:', err));

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${webhookPayload.event} event`,
        investorId: investor.id,
        bookingStatus 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error processing Calendly webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});