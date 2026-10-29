import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PRODUCTION_URL, SALES_EMAIL, PAGE_URLS, LOGO_URL, HELLO_EMAIL, PAYMENTS_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Logging helper
const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-QUOTE-WEBHOOK] ${step}${detailsStr}`);
};

// Send notification email to sales team
async function sendSalesNotification(
  paymentData: {
    quoteId: string;
    companyName: string;
    contactEmail: string;
    contactName: string;
    paymentType: string;
    amount: number;
    currency: string;
    isSubscription?: boolean;
  }
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("Warning: RESEND_API_KEY not configured, skipping sales notification");
    return;
  }

  const paymentTypeLabel = {
    slot_reservation: "Slot Reservation (Deposit)",
    setup_fee: "Setup Fee",
    monthly_retainer: "Monthly Retainer (Subscription)",
  }[paymentData.paymentType] || paymentData.paymentType;

  const amountFormatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: paymentData.currency.toUpperCase(),
  }).format(paymentData.amount / 100);

  const subscriptionNote = paymentData.isSubscription 
    ? '<p style="color: #059669; font-weight: bold; margin-top: 12px;">🔄 This is a RECURRING MONTHLY subscription</p>'
    : '';

  // Build HTML as joined array to prevent =20 encoding issues
  const html = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Payment Received</title>',
    '</head>',
    `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;padding:40px 20px;">`,
    '<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">',
    '<div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:30px;text-align:center;">',
    '<h1 style="color:white;margin:0;font-size:24px;">💰 Payment Received!</h1>',
    '</div>',
    '<div style="padding:30px;">',
    '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin-bottom:24px;">',
    `<h2 style="color:#166534;margin:0 0 8px 0;font-size:18px;">${paymentTypeLabel} Payment Completed</h2>`,
    `<p style="color:#15803d;margin:0;font-size:28px;font-weight:bold;">${amountFormatted}${paymentData.isSubscription ? '/month' : ''}</p>`,
    subscriptionNote,
    '</div>',
    '<h3 style="color:#1e293b;margin:0 0 16px 0;font-size:16px;">Client Details</h3>',
    '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">',
    '<tr>',
    '<td style="padding:8px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">Company</td>',
    `<td style="padding:8px 0;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;text-align:right;">${paymentData.companyName || 'Not provided'}</td>`,
    '</tr>',
    '<tr>',
    '<td style="padding:8px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">Contact</td>',
    `<td style="padding:8px 0;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;text-align:right;">${paymentData.contactName || 'Not provided'}</td>`,
    '</tr>',
    '<tr>',
    '<td style="padding:8px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">Email</td>',
    `<td style="padding:8px 0;color:#1e293b;font-weight:500;border-bottom:1px solid #e2e8f0;text-align:right;">${paymentData.contactEmail || 'Not provided'}</td>`,
    '</tr>',
    '<tr>',
    '<td style="padding:8px 0;color:#64748b;">Quote ID</td>',
    `<td style="padding:8px 0;color:#1e293b;font-weight:500;text-align:right;">${paymentData.quoteId}</td>`,
    '</tr>',
    '</table>',
    '<div style="text-align:center;">',
    `<a href="${PAGE_URLS.adminQuotes}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">View in Admin</a>`,
    '</div>',
    '</div>',
    '<div style="background:#f1f5f9;padding:20px;text-align:center;">',
    '<p style="color:#64748b;margin:0;font-size:12px;">AlfredAI Payment Notification</p>',
    '</div>',
    '</div>',
    '</body>',
    '</html>',
  ].join('');

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `alfred ai Payments <${PAYMENTS_EMAIL}>`,
        to: [SALES_EMAIL],
        subject: `💰 Payment Received: ${paymentTypeLabel} - ${paymentData.companyName || 'Client'}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Sales notification failed", { status: response.status, error: errorText });
    } else {
      logStep("Sales notification sent successfully");
    }
  } catch (err) {
    logStep("Sales notification error", { error: String(err) });
  }
}

// Send confirmation email to the customer
async function sendCustomerConfirmation(
  paymentData: {
    quoteId: string;
    companyName: string;
    contactEmail: string;
    contactName: string;
    paymentType: string;
    amount: number;
    currency: string;
    receiptUrl?: string;
    isSubscription?: boolean;
  }
): Promise<void> {
  if (!paymentData.contactEmail) {
    logStep("No customer email provided, skipping customer confirmation");
    return;
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    logStep("Warning: RESEND_API_KEY not configured, skipping customer confirmation");
    return;
  }

  const paymentTypeLabel = {
    slot_reservation: "Production Slot Reservation",
    setup_fee: "AI Implementation Setup Fee",
    monthly_retainer: "Monthly Partnership Retainer",
  }[paymentData.paymentType] || paymentData.paymentType;

  const amountFormatted = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: paymentData.currency.toUpperCase(),
  }).format(paymentData.amount / 100);

  const nextSteps = {
    slot_reservation: `
      <li style="margin-bottom: 12px;">Your production slot has been secured and reserved</li>
      <li style="margin-bottom: 12px;">A member of our team will be in touch within 24-48 hours to schedule your kickoff call</li>
      <li style="margin-bottom: 12px;">In the meantime, we'll prepare your implementation timeline and resource allocation</li>
    `,
    setup_fee: `
      <li style="margin-bottom: 12px;">Your AI implementation is now scheduled to begin</li>
      <li style="margin-bottom: 12px;">Our team will reach out within 24 hours to confirm your kickoff date</li>
      <li style="margin-bottom: 12px;">You'll receive access to your project dashboard shortly</li>
    `,
    monthly_retainer: `
      <li style="margin-bottom: 12px;"><strong>Subscription Activated:</strong> Your monthly AI partnership retainer is now active</li>
      <li style="margin-bottom: 12px;"><strong>Recurring Billing:</strong> You will be automatically charged ${amountFormatted} on the same date each month</li>
      <li style="margin-bottom: 12px;"><strong>As Per Agreement:</strong> This recurring payment is as per the quote, proposal, terms and service agreement shared with you</li>
      <li style="margin-bottom: 12px;"><strong>Cancellation/Termination:</strong> Policy as per your signed Agreement/Contract. Contact us at ${HELLO_EMAIL} for any changes</li>
      <li style="margin-bottom: 12px;">Our support team is available for any questions</li>
    `,
  }[paymentData.paymentType] || '<li>Our team will be in touch shortly with next steps</li>';

  const receiptSection = paymentData.receiptUrl 
    ? `<p style="text-align: center; margin-top: 16px;"><a href="${paymentData.receiptUrl}" style="color: #3b82f6; text-decoration: underline;">View Receipt</a></p>`
    : '';

  const subscriptionBadge = paymentData.isSubscription 
    ? '<span style="display: inline-block; background: #059669; color: white; font-size: 11px; padding: 4px 8px; border-radius: 4px; margin-left: 8px;">RECURRING</span>'
    : '';

  // Build HTML as joined array to prevent =20 encoding issues
  const html = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<title>Payment Confirmation</title>',
    '</head>',
    `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;padding:40px 20px;">`,
    '<div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">',
    '<div style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:30px;text-align:center;">',
    `<img src="${LOGO_URL}" alt="AlfredAI" style="height:40px;margin-bottom:16px;">`,
    '<h1 style="color:white;margin:0;font-size:24px;">Payment Confirmed</h1>',
    '</div>',
    '<div style="padding:30px;">',
    `<p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">Hi ${paymentData.contactName || 'there'},</p>`,
    `<p style="color:#475569;font-size:16px;line-height:1.6;margin-bottom:24px;">Thank you for your payment! We've successfully received your <strong>${paymentTypeLabel}</strong> payment.${subscriptionBadge}</p>`,
    '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">',
    '<p style="color:#166534;margin:0 0 4px 0;font-size:14px;">Payment Amount</p>',
    `<p style="color:#15803d;margin:0;font-size:32px;font-weight:bold;">${amountFormatted}${paymentData.isSubscription ? '/month' : ''}</p>`,
    `<p style="color:#166534;margin:8px 0 0 0;font-size:12px;">Reference: ${paymentData.quoteId}</p>`,
    receiptSection,
    '</div>',
    '<h3 style="color:#1e293b;margin:0 0 16px 0;font-size:18px;">What happens next?</h3>',
    '<ul style="color:#475569;font-size:14px;line-height:1.6;padding-left:20px;margin-bottom:24px;">',
    nextSteps,
    '</ul>',
    `<p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px;">If you have any questions, simply reply to this email or contact us at <a href="mailto:${HELLO_EMAIL}" style="color:#3b82f6;">${HELLO_EMAIL}</a>.</p>`,
    '<p style="color:#475569;font-size:14px;line-height:1.6;">Best regards,<br><strong>The AlfredAI Team</strong></p>',
    '</div>',
    '<div style="background:#f1f5f9;padding:20px;text-align:center;">',
    '<p style="color:#64748b;margin:0 0 8px 0;font-size:12px;">AlfredAI - Your AI-Powered Business Partner</p>',
    '<p style="color:#94a3b8;margin:0;font-size:11px;">This is an automated payment confirmation. Please keep this for your records.</p>',
    '</div>',
    '</div>',
    '</body>',
    '</html>',
  ].join('');

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `alfred ai <${PAYMENTS_EMAIL}>`,
        to: [paymentData.contactEmail],
        subject: `✅ Payment Confirmed - ${paymentTypeLabel}${paymentData.isSubscription ? ' (Recurring)' : ''}`,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("Customer confirmation failed", { status: response.status, error: errorText });
    } else {
      logStep("Customer confirmation sent successfully", { to: paymentData.contactEmail });
    }
  } catch (err) {
    logStep("Customer confirmation error", { error: String(err) });
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    // Verify the Stripe webhook signature before trusting the event.
    const webhookSecret = Deno.env.get("STRIPE_QUOTE_WEBHOOK_SECRET");
    let event: Stripe.Event;
    if (webhookSecret) {
      if (!signature) {
        logStep("Missing stripe-signature header");
        return new Response(JSON.stringify({ received: false, error: "Missing signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        logStep("Invalid webhook signature", { error: (err as Error).message });
        return new Response(JSON.stringify({ received: false, error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Fail closed: without a configured secret we cannot trust the event.
      logStep("STRIPE_QUOTE_WEBHOOK_SECRET not configured - rejecting");
      return new Response(JSON.stringify({ received: false, error: "Webhook secret not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    
    logStep("Event type", { type: event.type });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session completed", { sessionId: session.id, mode: session.mode });

      // Extract metadata
      const metadata = session.metadata || {};
      const quoteId = metadata.quote_id || "unknown";
      const paymentType = metadata.payment_type || "unknown";
      const companyName = metadata.company_name || "";
      const pricingOption = metadata.pricing_option;
      const isSubscription = session.mode === "subscription";

      // Get customer email from session
      const customerEmail = session.customer_details?.email || session.customer_email || "";
      const customerName = session.customer_details?.name || "";

      logStep("Payment metadata", { quoteId, paymentType, companyName, customerEmail, isSubscription });

      // Get payment intent details for receipt (only for one-time payments)
      let receiptUrl: string | undefined;
      let receiptNumber: string | undefined;
      
      if (session.payment_intent && !isSubscription) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);
          if (paymentIntent.latest_charge) {
            const charge = await stripe.charges.retrieve(paymentIntent.latest_charge as string);
            receiptUrl = charge.receipt_url || undefined;
            receiptNumber = charge.receipt_number || undefined;
          }
        } catch (err) {
          logStep("Could not fetch receipt details", { error: String(err) });
        }
      }

      // For subscriptions, get the subscription ID
      let subscriptionId: string | undefined;
      if (isSubscription && session.subscription) {
        subscriptionId = session.subscription as string;
        logStep("Subscription created", { subscriptionId });
      }

      // Check if payment record already exists (from initial link generation)
      const { data: existingPayment } = await supabase
        .from("quote_payments")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existingPayment) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("quote_payments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            stripe_payment_intent_id: isSubscription ? subscriptionId : (session.payment_intent as string),
            stripe_customer_id: session.customer as string,
            contact_email: customerEmail || undefined,
            contact_name: customerName || undefined,
            receipt_url: receiptUrl,
            receipt_number: receiptNumber,
          })
          .eq("id", existingPayment.id);

        if (updateError) {
          logStep("Error updating payment record", { error: updateError });
        } else {
          logStep("Payment record updated to completed", { id: existingPayment.id });
        }
      } else {
        // Create new record (in case webhook arrives before DB record was created)
        const { error: insertError } = await supabase
          .from("quote_payments")
          .insert({
            quote_id: quoteId,
            company_name: companyName,
            contact_email: customerEmail,
            contact_name: customerName,
            payment_type: paymentType,
            amount: session.amount_total || 0,
            currency: session.currency || "aud",
            stripe_session_id: session.id,
            stripe_payment_intent_id: isSubscription ? subscriptionId : (session.payment_intent as string),
            stripe_customer_id: session.customer as string,
            pricing_option: pricingOption,
            status: "completed",
            completed_at: new Date().toISOString(),
            receipt_url: receiptUrl,
            receipt_number: receiptNumber,
          });

        if (insertError) {
          logStep("Error inserting payment record", { error: insertError });
        } else {
          logStep("Payment record created as completed");
        }
      }

      // Send email notifications
      const paymentData = {
        quoteId,
        companyName,
        contactEmail: customerEmail,
        contactName: customerName,
        paymentType,
        amount: session.amount_total || 0,
        currency: session.currency || "aud",
        receiptUrl,
        isSubscription,
      };

      // Send both notifications in parallel
      await Promise.all([
        sendSalesNotification(paymentData),
        sendCustomerConfirmation(paymentData),
      ]);

      logStep("Webhook processing complete");

    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Checkout session expired", { sessionId: session.id });

      // Update record to expired
      const { error: updateError } = await supabase
        .from("quote_payments")
        .update({ status: "expired" })
        .eq("stripe_session_id", session.id);

      if (updateError) {
        logStep("Error updating payment to expired", { error: updateError });
      }

    } else if (event.type === "customer.subscription.deleted") {
      // Handle subscription cancellation
      const subscription = event.data.object as Stripe.Subscription;
      logStep("Subscription cancelled", { subscriptionId: subscription.id });

      // Update any related payment records
      const { error: updateError } = await supabase
        .from("quote_payments")
        .update({ status: "cancelled" })
        .eq("stripe_payment_intent_id", subscription.id);

      if (updateError) {
        logStep("Error updating subscription cancellation", { error: updateError });
      }

    } else if (event.type === "invoice.payment_failed") {
      // Handle failed subscription payment
      const invoice = event.data.object as Stripe.Invoice;
      logStep("Invoice payment failed", { invoiceId: invoice.id, subscriptionId: invoice.subscription });

      if (invoice.subscription) {
        // Could send a notification here about failed payment
        logStep("Subscription payment failed - may need follow-up", { 
          subscriptionId: invoice.subscription,
          customerEmail: invoice.customer_email,
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Webhook error", { error: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});