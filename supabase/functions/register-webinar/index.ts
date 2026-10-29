import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationPayload {
  webinar_slug?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  industry?: string;
  country?: string;
  business_size?: string;
  turnover?: string;
  ai_interest?: string;
  repetitive_workflow?: string;
  consent?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  // Display values for the email
  webinar_title?: string;
  webinar_date_label?: string;
  webinar_time_label?: string;
  join_url?: string;
  calendar_url?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function clean(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function buildConfirmationEmail(p: RegistrationPayload): string {
  const name = clean(p.first_name) || "there";
  const title = p.webinar_title || "AI for SMEs: More Leads, Better Sales, and Smarter Operations";
  const dateLabel = p.webinar_date_label || "TBA";
  const timeLabel = p.webinar_time_label || "";
  const joinUrl = p.join_url || "https://new.alfredai.bot";
  const calendarUrl = p.calendar_url || joinUrl;
  const green = "#0f6b3f";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>You're registered</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1a1a;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5faf7;">
<tr><td style="padding:40px 20px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ede8;">
<tr><td style="background:linear-gradient(135deg,${green} 0%,#14532d 100%);padding:32px 40px;text-align:center;">
<p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#bbf7d0;">AlfredAI &times; PopBusiness</p>
<h1 style="margin:12px 0 0 0;font-size:24px;color:#ffffff;font-weight:700;">You're registered &#127881;</h1>
</td></tr>
<tr><td style="padding:36px 40px;">
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;">Hi ${name},</p>
<p style="margin:0 0 18px 0;font-size:16px;line-height:1.6;">Thanks for registering for <strong>${title}</strong>.</p>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;">
<tr><td style="background:#f0f9f4;border:1px solid #cfe9da;border-radius:12px;padding:20px 24px;">
<p style="margin:0 0 6px 0;font-size:13px;color:#0f6b3f;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Webinar details</p>
<p style="margin:0;font-size:15px;line-height:1.7;color:#1a1a1a;">&#128197; ${dateLabel}${timeLabel ? ` &middot; ${timeLabel}` : ""}<br/>&#128250; Live online webinar &middot; 60 minutes &middot; Free</p>
</td></tr></table>
<p style="margin:0 0 12px 0;font-size:16px;line-height:1.6;">In this 60-minute session, we'll cover:</p>
<ul style="margin:0 0 24px 0;padding-left:20px;font-size:15px;line-height:1.8;color:#374151;">
<li>AI for sales and leads</li>
<li>AI for operations and systems</li>
<li>The four levels of SME AI adoption</li>
<li>How to choose the right first AI project</li>
<li>Q&amp;A with AlfredAI and PopBusiness</li>
</ul>
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;"><tr>
<td style="border-radius:10px;background:${green};"><a href="${calendarUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Add to calendar</a></td>
</tr></table>
<p style="margin:0 0 8px 0;font-size:14px;line-height:1.6;color:#374151;">Webinar Page for sharing: <a href="${joinUrl}" style="color:${green};">${joinUrl}</a></p>
<p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">Reply with one workflow you would love AI to improve in your business &mdash; we may cover it live.</p>
</td></tr>
<tr><td style="background:#f5faf7;padding:20px 40px;text-align:center;border-top:1px solid #e4ede8;">
<p style="margin:0;font-size:13px;color:#6b7280;">Hosted by AlfredAI &amp; PopBusiness &middot; Questions? <a href="mailto:sales@alfredai.bot" style="color:${green};">sales@alfredai.bot</a></p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) {
    console.warn("[register-webinar] Gmail credentials missing, skipping email");
    return;
  }
  const client = new SMTPClient({
    connection: { hostname: "smtp.gmail.com", port: 465, tls: true, auth: { username: gmailUser, password: gmailPassword } },
  });
  try {
    await client.send({
      from: `alfred ai x PopBusiness <${gmailUser}>`,
      to,
      subject,
      content: "This email contains HTML content. Please view it in an HTML-compatible email client.",
      html,
    });
    console.log(`[register-webinar] Confirmation email sent to ${to}`);
  } finally {
    await client.close();
  }
}

async function processInBackground(p: RegistrationPayload, email: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // GHL sync (non-fatal)
  try {
    const fullName = [clean(p.first_name), clean(p.last_name)].filter(Boolean).join(" ").trim() || email;
    await fetch(`${supabaseUrl}/functions/v1/log-ghl-submission`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({
        lead_email: email,
        lead_name: fullName,
        lead_phone: clean(p.phone),
        lead_company: clean(p.company),
        source_page: `/resources/webinars/${p.webinar_slug || "agenticbusiness"}`,
        source_medium: clean(p.utm_medium) || "webinar_landing",
        source_campaign: clean(p.utm_campaign) || "ai-for-smes-webinar",
        lead_source: "webinar_registration",
        ghl_status: "submitted",
        qualification_data: {
          role: clean(p.role),
          industry: clean(p.industry),
          country: clean(p.country),
          business_size: clean(p.business_size),
          turnover: clean(p.turnover),
          ai_interest: clean(p.ai_interest),
          repetitive_workflow: clean(p.repetitive_workflow, 1000),
          webinar: p.webinar_title || "AI for SMEs Webinar",
        },
        tags: ["webinar", "webinar-agentic-business"],
        utm_data: { utm_source: clean(p.utm_source), utm_medium: clean(p.utm_medium), utm_campaign: clean(p.utm_campaign) },
      }),
    });
  } catch (err) {
    console.error("[register-webinar] GHL sync failed:", err);
  }
  // Confirmation email (non-fatal)
  try {
    await sendEmail(email, "You're registered: AI for SMEs Webinar", buildConfirmationEmail(p));
  } catch (err) {
    console.error("[register-webinar] Email send failed:", err);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const p: RegistrationPayload = await req.json();
    const email = clean(p.email, 254)?.toLowerCase();
    const firstName = clean(p.first_name, 100);

    if (!email || !EMAIL_RE.test(email) || !firstName) {
      return new Response(
        JSON.stringify({ success: false, error: "Please provide a valid name and email address." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (p.consent !== true) {
      return new Response(
        JSON.stringify({ success: false, error: "Consent is required to register." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error: insertError } = await supabase.from("webinar_registrations").insert({
      webinar_slug: clean(p.webinar_slug) || "agenticbusiness",
      first_name: firstName,
      last_name: clean(p.last_name, 100),
      email,
      phone: clean(p.phone, 40),
      company: clean(p.company, 200),
      role: clean(p.role, 120),
      industry: clean(p.industry, 120),
      country: clean(p.country, 80),
      business_size: clean(p.business_size, 60),
      turnover: clean(p.turnover, 60),
      ai_interest: clean(p.ai_interest, 120),
      repetitive_workflow: clean(p.repetitive_workflow, 1000),
      consent: true,
      utm_source: clean(p.utm_source, 200),
      utm_medium: clean(p.utm_medium, 200),
      utm_campaign: clean(p.utm_campaign, 200),
    });

    if (insertError) {
      console.error("[register-webinar] Insert failed:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "We couldn't save your registration. Please try again." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    EdgeRuntime.waitUntil(processInBackground(p, email));

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[register-webinar] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Something went wrong. Please try again." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
