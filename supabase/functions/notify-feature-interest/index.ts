import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { LOGO_URL, SALES_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FeatureInterestRequest {
  email: string;
  feature: string;
  source: string;
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
      content: "This email contains HTML content.",
      html: html,
    });
    console.log(`Email sent successfully to ${to}`);
  } finally {
    await client.close();
  }
  return { success: true };
}

function buildFeatureInterestEmail(data: FeatureInterestRequest, timestamp: string): string {
  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>Feature Interest Notification</title>',
    '</head>',
    '<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;">',
    '<tr>',
    '<td style="padding:48px 24px;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">',
    // Header
    '<tr>',
    '<td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">',
    `<img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 12px auto;height:40px;width:auto;max-width:180px;">`,
    '<h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Feature Interest Alert</h1>',
    '</td>',
    '</tr>',
    // Body
    '<tr>',
    '<td style="background-color:#ffffff;padding:32px 40px;">',
    // Alert Banner
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:24px;">',
    '<tr>',
    '<td style="background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);border-radius:8px;padding:16px 20px;text-align:center;">',
    `<p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;">🔔 Interest in ${data.feature}</p>`,
    '</td>',
    '</tr>',
    '</table>',
    // Details Card
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:24px;">',
    '<tr>',
    '<td style="padding:24px;">',
    '<h2 style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#1e293b;">Interest Details</h2>',
    // Email row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="100" style="font-size:13px;color:#64748b;font-weight:500;">Email</td>',
    `<td style="font-size:14px;color:#3b82f6;"><a href="mailto:${data.email}" style="color:#3b82f6;text-decoration:none;">${data.email}</a></td>`,
    '</tr>',
    '</table>',
    // Feature row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="100" style="font-size:13px;color:#64748b;font-weight:500;">Feature</td>',
    `<td style="font-size:14px;color:#1e293b;font-weight:600;">${data.feature}</td>`,
    '</tr>',
    '</table>',
    // Source row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">',
    '<tr>',
    '<td width="100" style="font-size:13px;color:#64748b;font-weight:500;">Source</td>',
    `<td style="font-size:14px;color:#1e293b;">${data.source}</td>`,
    '</tr>',
    '</table>',
    // Timestamp row
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td width="100" style="font-size:13px;color:#64748b;font-weight:500;">Time</td>',
    `<td style="font-size:14px;color:#1e293b;">${timestamp}</td>`,
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '<p style="margin:0;font-size:14px;color:#64748b;text-align:center;">This person signed up to be notified when this feature launches.</p>',
    '</td>',
    '</tr>',
    // Footer
    '<tr>',
    '<td style="background-color:#f1f5f9;padding:20px 40px;text-align:center;border-radius:0 0 16px 16px;">',
    '<p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">This is an automated notification from AlfredAI.</p>',
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: FeatureInterestRequest = await req.json();

    if (!data.email || !data.feature) {
      throw new Error("Email and feature are required");
    }

    console.log(`Feature interest notification: ${data.email} interested in ${data.feature}`);

    // Format timestamp
    const timestamp = new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const subject = `🔔 Feature Interest: ${data.feature}`;
    const html = buildFeatureInterestEmail(data, timestamp);

    // Send email to sales
    await sendEmail(SALES_EMAIL, subject, html);

    // Log the email send
    try {
      await supabase.from("email_logs").insert({
        template_key: "feature_interest_notification",
        recipient_email: SALES_EMAIL,
        subject,
        status: "sent",
        function_name: "notify-feature-interest",
        metadata: { email: data.email, feature: data.feature, source: data.source },
      });
    } catch (logError) {
      console.error("Failed to log email send:", logError);
    }

    console.log(`Feature interest notification sent to ${SALES_EMAIL}`);

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in notify-feature-interest:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
