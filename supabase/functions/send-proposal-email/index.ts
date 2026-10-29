import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PRODUCTION_URL, SALES_EMAIL, LOGO_URL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendProposalEmailRequest {
  quoteId: string;
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  senderName: string;
  customMessage?: string;
  includePaymentLinks?: boolean;
  proposalUrl: string;
  setupFee?: number;
  monthlyRetainer?: number;
  pricingOption?: 'A' | 'A1' | 'B' | 'C';
}

function logStep(step: string, details?: Record<string, unknown>) {
  console.log(`[send-proposal-email] ${step}`, details ? JSON.stringify(details) : "");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', { 
    style: 'currency', 
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function getPricingOptionLabel(option: 'A' | 'A1' | 'B' | 'C'): string {
  switch (option) {
    case 'A': return 'Installment Plan (4-part setup)';
    case 'A1': return 'Full Upfront (no discount)';
    case 'B': return 'Standard (Upfront setup)';
    case 'C': return 'Discounted (10% off upfront)';
    default: return 'Standard';
  }
}

function buildProposalEmail(
  recipientName: string,
  companyName: string,
  senderName: string,
  proposalUrl: string,
  customMessage: string | undefined,
  setupFee: number | undefined,
  monthlyRetainer: number | undefined,
  pricingOption: 'A' | 'A1' | 'B' | 'C' | undefined
): string {
  const currentYear = new Date().getFullYear();
  const firstName = recipientName.split(' ')[0] || recipientName;
  
  // Build pricing section if fees are provided
  let pricingSection = '';
  if (setupFee || monthlyRetainer) {
    pricingSection = [
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">',
      '<tr>',
      '<td style="background:linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%);padding:24px;border-radius:12px;border:1px solid #e2e8f0;">',
      '<p style="margin:0 0 16px 0;font-size:14px;font-weight:600;color:#1e293b;">Investment Summary</p>',
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
      setupFee ? [
        '<tr>',
        '<td style="padding:8px 0;font-size:14px;color:#64748b;">Setup Fee (one-time)</td>',
        `<td style="padding:8px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${formatCurrency(setupFee)}</td>`,
        '</tr>',
      ].join('') : '',
      monthlyRetainer ? [
        '<tr>',
        '<td style="padding:8px 0;font-size:14px;color:#64748b;">Monthly Retainer</td>',
        `<td style="padding:8px 0;font-size:14px;font-weight:600;color:#1e293b;text-align:right;">${formatCurrency(monthlyRetainer)}/mo</td>`,
        '</tr>',
      ].join('') : '',
      pricingOption ? [
        '<tr>',
        '<td colspan="2" style="padding:12px 0 0 0;border-top:1px solid #e2e8f0;margin-top:8px;">',
        `<span style="font-size:12px;color:#64748b;">Payment Option: ${getPricingOptionLabel(pricingOption)}</span>`,
        '</td>',
        '</tr>',
      ].join('') : '',
      '</table>',
      '</td>',
      '</tr>',
      '</table>',
    ].join('');
  }

  // Build custom message section if provided
  let messageSection = '';
  if (customMessage && customMessage.trim()) {
    const escapedMessage = customMessage
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');
    
    messageSection = [
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">',
      '<tr>',
      '<td style="background-color:#fefce8;padding:20px;border-radius:12px;border-left:4px solid #eab308;">',
      `<p style="margin:0;font-size:14px;color:#854d0e;line-height:1.6;">"${escapedMessage}"</p>`,
      `<p style="margin:12px 0 0 0;font-size:13px;color:#a16207;">— ${senderName}</p>`,
      '</td>',
      '</tr>',
      '</table>',
    ].join('');
  }

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
    '<title>Your AlfredAI Proposal</title>',
    '</head>',
    '<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f8fafc;">',
    '<tr>',
    '<td style="padding:48px 24px;">',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px;margin:0 auto;">',
    // Header
    '<tr>',
    '<td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);border-radius:16px 16px 0 0;padding:40px;text-align:center;">',
    `<img src="${LOGO_URL}" alt="AlfredAI" style="display:block;margin:0 auto 16px auto;height:44px;width:auto;max-width:180px;">`,
    '<div style="display:inline-block;background:rgba(255,255,255,0.15);padding:8px 16px;border-radius:20px;margin-bottom:8px;">',
    '<span style="color:#ffffff;font-size:14px;font-weight:600;">📋 Your Proposal is Ready</span>',
    '</div>',
    `<p style="margin:8px 0 0 0;font-size:13px;color:rgba(255,255,255,0.8);">Prepared for ${companyName}</p>`,
    '</td>',
    '</tr>',
    // Body
    '<tr>',
    '<td style="background-color:#ffffff;padding:40px;">',
    `<h2 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#1e293b;">Hi ${firstName},</h2>`,
    `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#475569;">Thank you for taking the time to discuss how AlfredAI can help transform ${companyName}'s operations through intelligent automation.</p>`,
    '<p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#475569;">Based on our conversation, I\'ve prepared a detailed proposal outlining the recommended AI workflows, investment breakdown, and projected ROI for your business.</p>',
    messageSection,
    pricingSection,
    // CTA Button
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td align="center" style="padding:8px 0 24px 0;">',
    `<a href="${proposalUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;padding:16px 48px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(59,130,246,0.4);">View Full Proposal →</a>`,
    '</td>',
    '</tr>',
    '</table>',
    '<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#64748b;text-align:center;">Review your customized proposal, explore the details, and accept when you\'re ready to move forward.</p>',
    // 24h expiry note
    '<p style="margin:0 0 16px 0;font-size:12px;line-height:1.5;color:#94a3b8;text-align:center;">⏱ <em>Note: Any direct payment links expire in 24 hours (Stripe limitation). You can always generate a fresh link from your proposal page by clicking "Pay Now".</em></p>',
    // What's included
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;background-color:#f8fafc;padding:20px;border-radius:12px;">',
    '<tr>',
    '<td>',
    '<p style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#1e293b;">What\'s included in your proposal:</p>',
    '<ul style="margin:0;padding:0 0 0 20px;color:#475569;font-size:14px;line-height:1.8;">',
    '<li>Detailed breakdown of recommended AI workflows</li>',
    '<li>Investment summary and payment options</li>',
    '<li>Projected ROI and time savings analysis</li>',
    '<li>Implementation timeline overview</li>',
    '<li>Digital signature capability</li>',
    '</ul>',
    '</td>',
    '</tr>',
    '</table>',
    // Slot reservation & timeline info
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:0 0 24px 0;">',
    '<tr>',
    '<td style="background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%);padding:20px;border-radius:12px;border:1px solid #bfdbfe;">',
    '<p style="margin:0 0 14px 0;font-size:14px;font-weight:600;color:#1e40af;">⚡ Getting Started</p>',
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">',
    '<tr>',
    '<td style="padding:6px 0;font-size:14px;color:#1e3a5f;">',
    '<strong>Slot Reservation:</strong> $5,000 AUD (deducted from your setup fee)',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:6px 0;font-size:14px;color:#1e3a5f;">',
    '<strong>Lead Time to Start:</strong> 1 week from reservation',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:6px 0;font-size:14px;color:#1e3a5f;">',
    '<strong>PoC Build Time:</strong> 2 weeks',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:10px 0 0 0;border-top:1px solid #93c5fd;margin-top:8px;">',
    '<span style="font-size:13px;color:#2563eb;font-weight:500;">✅ Slot Reservation is 100% refundable if the project doesn\'t proceed.</span>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    // Contact section
    '<p style="margin:24px 0 0 0;font-size:14px;line-height:1.6;color:#475569;">If you have any questions or would like to discuss the proposal further, feel free to reply to this email or book a follow-up call.</p>',
    `<p style="margin:24px 0 0 0;font-size:14px;color:#475569;">Best regards,<br><strong>${senderName}</strong><br>AlfredAI Team</p>`,
    '</td>',
    '</tr>',
    // Footer
    '<tr>',
    '<td style="background-color:#f1f5f9;padding:24px 40px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;text-align:center;">',
    '<p style="margin:0 0 12px 0;font-size:13px;color:#64748b;line-height:1.5;">Questions? Contact us at sales@alfredai.bot</p>',
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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as SendProposalEmailRequest;
    const {
      quoteId,
      recipientEmail,
      recipientName,
      companyName,
      senderName,
      customMessage,
      proposalUrl,
      setupFee,
      monthlyRetainer,
      pricingOption,
    } = body;

    logStep("Request received", { quoteId, recipientEmail, recipientName, companyName });

    // Validate required fields
    if (!recipientEmail || !recipientName || !companyName || !senderName || !proposalUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email HTML
    const emailHtml = buildProposalEmail(
      recipientName,
      companyName,
      senderName,
      proposalUrl,
      customMessage,
      setupFee,
      monthlyRetainer,
      pricingOption
    );

    // Send via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      logStep("ERROR: RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subject = `Your AlfredAI Proposal for ${companyName}`;

    logStep("Sending email via Resend", { to: recipientEmail, subject });

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${senderName} via AlfredAI <${SALES_EMAIL}>`,
        to: [recipientEmail],
        subject,
        html: emailHtml,
        reply_to: SALES_EMAIL,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      logStep("Resend API error", { status: resendResponse.status, error: errorText });
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendResult = await resendResponse.json();
    logStep("Email sent successfully", { emailId: resendResult.id });

    // Log to email_logs table
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("email_logs").insert({
        template_key: "proposal_sent",
        recipient_email: recipientEmail,
        subject,
        status: "sent",
        delivery_status: "delivered",
        function_name: "send-proposal-email",
        metadata: {
          quote_id: quoteId,
          company_name: companyName,
          sender_name: senderName,
          resend_id: resendResult.id,
        },
      });
      logStep("Email logged to database");
    }

    // Also send a notification to sales team
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `alfred ai System <${SALES_EMAIL}>`,
          to: [SALES_EMAIL],
          subject: `📧 Proposal Sent: ${companyName}`,
          html: [
            '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">',
            `<h2>Proposal Email Sent</h2>`,
            `<p><strong>Company:</strong> ${companyName}</p>`,
            `<p><strong>Recipient:</strong> ${recipientName} (${recipientEmail})</p>`,
            `<p><strong>Sent by:</strong> ${senderName}</p>`,
            `<p><strong>Quote ID:</strong> ${quoteId || 'N/A'}</p>`,
            setupFee ? `<p><strong>Setup Fee:</strong> ${formatCurrency(setupFee)}</p>` : '',
            monthlyRetainer ? `<p><strong>Monthly:</strong> ${formatCurrency(monthlyRetainer)}/mo</p>` : '',
            `<p><strong>Proposal URL:</strong> <a href="${proposalUrl}">${proposalUrl}</a></p>`,
            customMessage ? `<p><strong>Custom Message:</strong><br>${customMessage}</p>` : '',
            '</body></html>',
          ].join(''),
        }),
      });
      logStep("Sales notification sent");
    } catch (notifyErr) {
      logStep("Sales notification failed (non-fatal)", { error: String(notifyErr) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Proposal email sent successfully",
        emailId: resendResult.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    logStep("ERROR", { message: String(err) });
    return new Response(
      JSON.stringify({ success: false, error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
