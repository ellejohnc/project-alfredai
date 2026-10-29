import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PARTNER-COMMISSION-WEBHOOK] ${step}${detailsStr}`);
};

// Map a Stripe PaymentIntent status to our deal payment_status.
// Commission is only ever gated on "succeeded" (cleared, not pending).
function mapPaymentStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "succeeded":
      return "succeeded";
    case "processing":
    case "requires_action":
    case "requires_confirmation":
    case "requires_capture":
    case "requires_payment_method":
      return "pending";
    case "canceled":
      return "failed";
    default:
      return "pending";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always respond 200 with a structured body for handled errors so Stripe/clients don't crash.
  const ok = (body: Record<string, unknown>) =>
    new Response(JSON.stringify({ success: true, ...body }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  const handled = (error: string, extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ success: false, error, ...extra }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return handled("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_PARTNER_WEBHOOK_SECRET");

    // Require a configured webhook secret and a valid signature (fail closed).
    let event: Stripe.Event;
    if (!webhookSecret) {
      logStep("STRIPE_PARTNER_WEBHOOK_SECRET not configured — rejecting");
      return handled("Webhook secret not configured");
    }
    if (!signature) {
      logStep("Missing stripe-signature header");
      return handled("Missing signature");
    }
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Signature verified");
    } catch (err) {
      logStep("Signature verification failed", { error: String(err) });
      return handled("Invalid webhook signature");
    }


    logStep("Event type", { type: event.type });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // We care about events that carry a definitive payment status.
    const relevant = [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "payment_intent.processing",
      "payment_intent.canceled",
      "charge.succeeded",
      "charge.refunded",
      "checkout.session.completed",
    ];
    if (!relevant.includes(event.type)) {
      return ok({ ignored: true, type: event.type });
    }

    // Resolve the deal id + the authoritative Stripe payment status.
    let dealId: string | undefined;
    let paymentIntentId: string | undefined;
    let stripeStatus = "pending";
    let refunded = false;

    if (event.type.startsWith("payment_intent.")) {
      const pi = event.data.object as Stripe.PaymentIntent;
      dealId = pi.metadata?.deal_id;
      paymentIntentId = pi.id;
      stripeStatus = pi.status;
    } else if (event.type.startsWith("charge.")) {
      const charge = event.data.object as Stripe.Charge;
      dealId = charge.metadata?.deal_id;
      paymentIntentId = (charge.payment_intent as string) ?? undefined;
      refunded = charge.refunded === true;
      stripeStatus = charge.status === "succeeded" && !refunded ? "succeeded" : "pending";
      if (event.type === "charge.refunded") stripeStatus = "failed";
    } else if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      dealId = session.metadata?.deal_id;
      paymentIntentId = (session.payment_intent as string) ?? undefined;
      // Only treat as cleared when Stripe confirms the payment is paid (not pending/unpaid).
      stripeStatus = session.payment_status === "paid" ? "succeeded" : "pending";
    }

    // Fall back to matching by an already-stored payment intent id.
    let query = supabase.from("deals").select("id, payment_status, commission_status");
    if (dealId) {
      query = query.eq("id", dealId);
    } else if (paymentIntentId) {
      query = query.eq("stripe_payment_intent_id", paymentIntentId);
    } else {
      return handled("No deal_id or payment_intent on event", { type: event.type });
    }

    const { data: deal, error: findErr } = await query.maybeSingle();
    if (findErr) return handled("Failed to look up deal", { detail: findErr.message });
    if (!deal) return handled("No matching deal found", { dealId, paymentIntentId });

    const payment_status = mapPaymentStatus(stripeStatus);
    logStep("Updating deal", { dealId: deal.id, stripeStatus, payment_status, refunded });

    // The DB trigger derives payment_cleared + commission eligibility from payment_status.
    const { error: updErr } = await supabase
      .from("deals")
      .update({
        payment_status,
        stripe_payment_intent_id: paymentIntentId ?? null,
      })
      .eq("id", deal.id);

    if (updErr) return handled("Failed to update deal", { detail: updErr.message });

    return ok({
      dealId: deal.id,
      payment_status,
      cleared: payment_status === "succeeded",
    });
  } catch (err) {
    logStep("Unhandled error", { error: String(err) });
    return handled(err instanceof Error ? err.message : "Unexpected error");
  }
});
