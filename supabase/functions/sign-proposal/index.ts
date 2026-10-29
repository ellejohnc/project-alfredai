import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { PRODUCTION_URL, SALES_EMAIL, LOGO_URL } from "../_shared/config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignRequest {
  quoteId: string;
  accessCode: string;
  signerName: string;
  signerEmail: string;
  signatureData: string;
  signatureType: 'typed' | 'drawn';
  termsAccepted: boolean;
  sessionId?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildClientConfirmationEmail(
  signerNameRaw: string,
  companyNameRaw: string,
  quoteIdRaw: string,
  proposalUrl: string,
  setupFee: number | null,
  monthlyRetainer: number | null
): string {
  const signerName = escapeHtml(signerNameRaw);
  const companyName = escapeHtml(companyNameRaw);
  const quoteId = escapeHtml(quoteIdRaw);

  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
    '<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">',
    '<table role="presentation" width="100%" style="background-color:#f8fafc;padding:40px 20px;">',
    '<tr><td align="center">',
    '<table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">',
    // Header
    '<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:32px 40px;text-align:center;">',
    `<img src="${LOGO_URL}" alt="AlfredAI" height="36" style="height:36px;margin-bottom:16px;" />`,
    '<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Proposal Accepted! 🎉</h1>',
    '</td></tr>',
    // Body
    '<tr><td style="padding:32px 40px;">',
    `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#334155;">Hi ${signerName},</p>`,
    `<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#334155;">Thank you for accepting the proposal for <strong>${companyName}</strong>. We're excited to get started on your AI automation journey!</p>`,
    // Summary box
    '<table role="presentation" width="100%" style="background:#f1f5f9;border-radius:8px;margin:24px 0;">',
    '<tr><td style="padding:20px;">',
    `<p style="margin:0 0 8px;font-size:13px;color:#64748b;">Quote Reference</p>`,
    `<p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#0f172a;font-family:monospace;">${quoteId}</p>`,
    setupFee ? `<p style="margin:0 0 4px;font-size:13px;color:#64748b;">Setup Fee</p><p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#0f172a;">${formatCurrency(setupFee)}</p>` : '',
    monthlyRetainer ? `<p style="margin:0 0 4px;font-size:13px;color:#64748b;">Monthly Retainer</p><p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;">${formatCurrency(monthlyRetainer)}/mo</p>` : '',
    '</td></tr></table>',
    // Next steps
    '<h2 style="margin:24px 0 12px;font-size:18px;color:#0f172a;">What happens next?</h2>',
    '<ol style="margin:0 0 24px;padding-left:20px;color:#475569;line-height:1.8;">',
    '<li>Our team will review your signed proposal</li>',
    '<li>You\'ll receive payment instructions shortly</li>',
    '<li>We\'ll schedule a kickoff call to begin your project</li>',
    '</ol>',
    // CTA button
    '<table role="presentation" width="100%"><tr><td align="center" style="padding:8px 0 24px;">',
    `<a href="${proposalUrl}" style="display:inline-block;background:linear-gradient(135deg,#16a34a,#15803d);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">View Your Proposal</a>`,
    '</td></tr></table>',
    `<p style="margin:24px 0 0;font-size:14px;color:#475569;">If you have any questions, reply to this email or reach us at <a href="mailto:${SALES_EMAIL}" style="color:#2563eb;">${SALES_EMAIL}</a>.</p>`,
    '<p style="margin:16px 0 0;font-size:14px;color:#475569;">Best regards,<br><strong>The AlfredAI Team</strong></p>',
    '</td></tr>',
    // Footer
    '<tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">',
    `<p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} AlfredAI. All rights reserved.</p>`,
    '</td></tr>',
    '</table></td></tr></table></body></html>'
  ].join('');
}

function buildSalesNotificationEmail(
  signerNameRaw: string,
  signerEmailRaw: string,
  companyNameRaw: string,
  quoteIdRaw: string,
  proposalUrl: string,
  setupFee: number | null,
  monthlyRetainer: number | null
): string {
  const signerName = escapeHtml(signerNameRaw);
  const signerEmail = escapeHtml(signerEmailRaw);
  const companyName = escapeHtml(companyNameRaw);
  const quoteId = escapeHtml(quoteIdRaw);

  return [
    '<!DOCTYPE html><html><body style="font-family:sans-serif;padding:20px;">',
    '<h2 style="color:#16a34a;">✅ Proposal Signed!</h2>',
    `<p><strong>Company:</strong> ${companyName}</p>`,
    `<p><strong>Signed by:</strong> ${signerName} (${signerEmail})</p>`,
    `<p><strong>Quote ID:</strong> ${quoteId}</p>`,
    `<p><strong>Signed at:</strong> ${new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' })}</p>`,
    setupFee ? `<p><strong>Setup Fee:</strong> ${formatCurrency(setupFee)}</p>` : '',
    monthlyRetainer ? `<p><strong>Monthly Retainer:</strong> ${formatCurrency(monthlyRetainer)}/mo</p>` : '',
    `<p><strong>Proposal:</strong> <a href="${proposalUrl}">${proposalUrl}</a></p>`,
    '<hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0;">',
    '<p style="color:#64748b;font-size:13px;">⚡ Action required: Review handover request and send payment links if not already generated.</p>',
    '</body></html>'
  ].join('');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json() as SignRequest;
    const { quoteId, accessCode, signerName, signerEmail, signatureData, signatureType, termsAccepted, sessionId } = body;

    // Validate required fields
    if (!quoteId || !signerName || !signerEmail || !signatureData || !termsAccepted) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for audit
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Hash IP for privacy
    const ipHash = clientIp !== 'unknown' 
      ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientIp))
          .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16))
      : null;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[sign-proposal] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify quote exists and access code is valid
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_id', quoteId.toUpperCase())
      .maybeSingle();

    if (quoteError || !quote) {
      console.error('[sign-proposal] Quote not found:', quoteId);
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Access code validation
    const dbHasAccessCode = quote.access_code && quote.access_code.trim() !== '';
    const requestHasAccessCode = accessCode && accessCode.trim() !== '';
    
    if (dbHasAccessCode) {
      if (!requestHasAccessCode || quote.access_code !== accessCode) {
        console.error('[sign-proposal] Access code missing or mismatch for quote:', quoteId);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid access code' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    console.log('[sign-proposal] Access code check passed:', {
      dbHasCode: dbHasAccessCode,
      requestHasCode: requestHasAccessCode
    });

    // Check if already signed
    if (quote.signed_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'This proposal has already been signed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert signature record
    const { error: sigError } = await supabase
      .from('proposal_signatures')
      .insert({
        quote_id: quote.id,
        signer_name: signerName,
        signer_email: signerEmail,
        signer_ip_hash: ipHash,
        user_agent: userAgent.slice(0, 500),
        signature_data: signatureData,
        signature_type: signatureType,
        terms_accepted: termsAccepted,
        session_id: sessionId
      });

    if (sigError) {
      console.error('[sign-proposal] Error inserting signature:', sigError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save signature' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update quote status to signed
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'signed',
        signed_at: new Date().toISOString(),
        signed_by_name: signerName,
        signed_by_email: signerEmail,
        signature_ip_hash: ipHash,
        handover_status: 'triggered',
        handover_triggered_at: new Date().toISOString()
      })
      .eq('id', quote.id);

    if (updateError) {
      console.error('[sign-proposal] Error updating quote:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update quote status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create handover request
    const { error: handoverError } = await supabase
      .from('handover_requests')
      .insert({
        quote_id: quote.id,
        company_name: quote.company_name || 'Unknown Company',
        contact_name: quote.contact_name,
        contact_email: quote.contact_email,
        workflows: quote.workflows,
        setup_fee_min: quote.setup_fee_min,
        setup_fee_max: quote.setup_fee_max,
        monthly_retainer_min: quote.monthly_retainer_min,
        monthly_retainer_max: quote.monthly_retainer_max,
        priority: 'normal',
        status: 'pending'
      });

    if (handoverError) {
      console.error('[sign-proposal] Error creating handover request:', handoverError);
      // Non-fatal - continue
    }

    console.log(`[sign-proposal] Quote ${quoteId} signed successfully by ${signerEmail}`);

    // ===== SEND CONFIRMATION EMAILS (non-blocking) =====
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const proposalUrl = `${PRODUCTION_URL}/proposal/${quoteId}`;
    const companyName = quote.company_name || 'Your Company';
    const setupFee = quote.setup_fee_final ?? quote.setup_fee_min;
    const monthlyRetainer = quote.monthly_retainer_final ?? quote.monthly_retainer_min;

    if (resendApiKey) {
      // 1) Client confirmation email
      try {
        const clientHtml = buildClientConfirmationEmail(
          signerName, companyName, quoteId, proposalUrl, setupFee, monthlyRetainer
        );

        const clientRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'alfred ai <noreply@alfredai.bot>',
            to: [signerEmail],
            subject: `✅ Proposal Accepted — ${companyName}`,
            html: clientHtml,
            reply_to: SALES_EMAIL,
          }),
        });

        if (clientRes.ok) {
          const result = await clientRes.json();
          console.log('[sign-proposal] Client confirmation email sent:', result.id);
          
          // Log to email_logs
          await supabase.from('email_logs').insert({
            template_key: 'proposal_signed_client',
            recipient_email: signerEmail,
            subject: `✅ Proposal Accepted — ${companyName}`,
            status: 'sent',
            delivery_status: 'delivered',
            function_name: 'sign-proposal',
            metadata: { quote_id: quoteId, company_name: companyName, resend_id: result.id },
          });
        } else {
          const errText = await clientRes.text();
          console.error('[sign-proposal] Client email failed:', errText);
        }
      } catch (emailErr) {
        console.error('[sign-proposal] Client email error (non-fatal):', emailErr);
      }

      // 2) Sales team notification email
      try {
        const salesHtml = buildSalesNotificationEmail(
          signerName, signerEmail, companyName, quoteId, proposalUrl, setupFee, monthlyRetainer
        );

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'alfred ai System <noreply@alfredai.bot>',
            to: [SALES_EMAIL],
            subject: `🎉 PROPOSAL SIGNED: ${companyName} — ${quoteId}`,
            html: salesHtml,
          }),
        });
        console.log('[sign-proposal] Sales notification sent');
      } catch (notifyErr) {
        console.error('[sign-proposal] Sales notification failed (non-fatal):', notifyErr);
      }
    } else {
      console.warn('[sign-proposal] RESEND_API_KEY not set — skipping confirmation emails');
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Proposal signed successfully',
        signedAt: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[sign-proposal] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
