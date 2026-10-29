import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PRODUCTION_URL, HELLO_EMAIL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed $5,000 AUD deposit product/price
const SLOT_RESERVATION_PRICE_ID = "price_1SrKWyB0GQ7eTHlQdXA5kNOw";

// Payment type definitions
type PaymentType = 
  | "slot_reservation" 
  | "setup_fee"           // Full setup (Options B & C)
  | "setup_initiation"    // 50% upfront (Option A)
  | "setup_month1"        // 20% Month 1 (Option A)
  | "setup_month2"        // 20% Month 2 (Option A)
  | "setup_month3"        // 10% Month 3 (Option A)
  | "monthly_retainer";

// Installment configuration for Option A
// Note: Initiation fee has the $5,000 slot reservation deducted (handled by frontend hook)
const INSTALLMENT_CONFIG: Record<string, { label: string; percent: number; installmentNumber: number; totalParts?: number; descriptionNote?: string }> = {
  setup_initiation: { 
    label: 'Project Initiation (50% less deposit)', 
    percent: 0.5, 
    installmentNumber: 1,
    descriptionNote: 'This amount reflects 50% of the setup fee, less the Production Slot Deposit already paid.',
  },
  setup_month1: { label: 'Month 1 Payment (20%)', percent: 0.2, installmentNumber: 2 },
  setup_month2: { label: 'Month 2 Payment (20%)', percent: 0.2, installmentNumber: 3 },
  setup_month3: { label: 'Final Payment (10%)', percent: 0.1, installmentNumber: 4 },
  // Custom staged schedules (amount-driven, not percentage-driven)
  setup_second: { label: 'Second Payment', percent: 0, installmentNumber: 2, totalParts: 3 },
  setup_balance: { label: 'Final Balance Payment', percent: 0, installmentNumber: 3, totalParts: 3 },
};

interface PaymentLinkRequest {
  quoteId: string;
  companyName: string;
  contactEmail?: string;
  contactName?: string;
  paymentType: PaymentType;
  amount?: number; // Amount in cents for dynamic pricing
  pricingOption?: "A" | "B" | "C";
  description?: string;
  currency?: "aud" | "usd"; // Currency for payment - defaults to AUD
  installmentNumber?: number; // For tracking installment sequence
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-QUOTE-PAYMENT-LINK] ${step}${detailsStr}`);
};

// Debug helper: inspect line items pre-creation and confirm GST presence/strategy
function debugGstOnLineItems(
  context: string,
  paymentType: string,
  currency: string,
  mode: "payment" | "subscription",
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
) {
  const summary = lineItems.map((li, idx) => {
    const pd = li.price_data;
    const productName = pd?.product_data?.name ?? "(unknown)";
    const meta = (pd?.product_data?.metadata ?? {}) as Record<string, string>;
    return {
      index: idx,
      name: productName,
      currency: pd?.currency,
      unit_amount: pd?.unit_amount,
      quantity: li.quantity,
      recurring: pd?.recurring ?? null,
      line_type: meta.line_type ?? null,
      gst_included_in_unit_amount: meta.gst_included === "true",
      base_amount: meta.base_amount ?? null,
      gst_amount: meta.gst_amount ?? null,
    };
  });

  // Detect GST strategy:
  //   - "separate_line_item": a line item explicitly named/tagged as GST exists (one-off AUD path)
  //   - "bundled_in_unit_amount": metadata.gst_included === 'true' on a line item (subscription AUD path)
  //   - "not_applicable": non-AUD currency, GST does not apply
  //   - "MISSING": AUD payment with no GST evidence — this is a bug
  const hasSeparateGstLine = summary.some(
    (s) => s.line_type === "gst" || /\bGST\b/i.test(s.name),
  );
  const hasBundledGst = summary.some((s) => s.gst_included_in_unit_amount);

  let gstStrategy: string;
  let gstPresent: boolean;
  if (currency !== "aud") {
    gstStrategy = "not_applicable";
    gstPresent = false;
  } else if (hasSeparateGstLine) {
    gstStrategy = "separate_line_item";
    gstPresent = true;
  } else if (hasBundledGst) {
    gstStrategy = "bundled_in_unit_amount";
    gstPresent = true;
  } else {
    gstStrategy = "MISSING";
    gstPresent = false;
  }

  const totalUnitAmount = summary.reduce(
    (sum, s) => sum + (s.unit_amount ?? 0) * (s.quantity ?? 1),
    0,
  );

  const debugPayload = {
    context,
    payment_type: paymentType,
    mode,
    currency,
    line_item_count: lineItems.length,
    total_unit_amount_cents: totalUnitAmount,
    gst_present: gstPresent,
    gst_strategy: gstStrategy,
    line_items: summary,
  };

  logStep("GST_DEBUG ▶ line items pre-creation", debugPayload);

  if (currency === "aud" && !gstPresent) {
    console.error(
      `[CREATE-QUOTE-PAYMENT-LINK] ⚠️ GST_DEBUG: AUD ${paymentType} session is being created WITHOUT GST evidence!`,
      debugPayload,
    );
  }
}

// Helper to determine installment type for database tracking
function getInstallmentType(paymentType: PaymentType): string | null {
  if (paymentType === 'setup_fee') return 'full';
  if (paymentType.startsWith('setup_')) {
    return paymentType.replace('setup_', '');
  }
  return null;
}

// GST rate for Australian payments (10%)
const GST_RATE = 0.10;

// Helper to create a GST line item for AUD payments
function createGstLineItem(baseAmountCents: number, currency: string, productName: string, quoteId: string, companyName: string): Stripe.Checkout.SessionCreateParams.LineItem | null {
  if (currency !== 'aud') return null;
  const gstAmount = Math.round(baseAmountCents * GST_RATE);
  if (gstAmount <= 0) return null;
  return {
    price_data: {
      currency,
      product_data: {
        name: `GST (10%) — ${productName}`,
        description: `Goods and Services Tax at 10% on ${productName}`,
        metadata: { quote_id: quoteId, company_name: companyName, line_type: 'gst' },
      },
      unit_amount: gstAmount,
    },
    quantity: 1,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body: PaymentLinkRequest = await req.json();
    logStep("Request body received", body);

    const { 
      quoteId, 
      companyName, 
      contactEmail, 
      contactName,
      paymentType, 
      amount, 
      pricingOption,
      description,
      currency: requestedCurrency,
      installmentNumber,
    } = body;

    // Default to AUD if not specified, normalize to lowercase
    const currency = (requestedCurrency || "aud").toLowerCase() as "aud" | "usd";
    const currencySymbol = currency === "aud" ? "A$" : "US$";
    const taxLabel = currency === "aud" ? "+ GST" : "excl. tax";

    if (!quoteId || !companyName || !paymentType) {
      throw new Error("Missing required fields: quoteId, companyName, paymentType");
    }

    let checkoutSession: Stripe.Checkout.Session;
    const origin = req.headers.get("origin") || PRODUCTION_URL;
    
    // Check for existing customer by email (only if email provided and valid)
    let customerId: string | undefined;
    const validEmail = contactEmail && contactEmail.trim() && contactEmail.trim() !== 'null' && contactEmail.includes('@')
      ? contactEmail.trim() 
      : undefined;
    
    if (validEmail) {
      const customers = await stripe.customers.list({ email: validEmail, limit: 10 });
      // Find an existing customer that is currency-compatible with the requested currency.
      // Stripe locks a customer to the first currency used; reusing one with a different
      // currency throws "You cannot combine currencies on a single customer".
      for (const c of customers.data) {
        const existingCurrency = (c.currency || "").toLowerCase();
        if (!existingCurrency || existingCurrency === currency) {
          customerId = c.id;
          logStep("Found compatible existing Stripe customer", { customerId, existingCurrency, requestedCurrency: currency });
          break;
        }
      }
      if (!customerId && customers.data.length > 0) {
        // All existing customers are locked to a different currency — create a new one
        // so Stripe doesn't reject the session. Tag it with the currency for clarity.
        const newCustomer = await stripe.customers.create({
          email: validEmail,
          name: contactName || companyName,
          metadata: { quote_id: quoteId, currency_variant: currency },
        });
        customerId = newCustomer.id;
        logStep("Created new Stripe customer due to currency mismatch", { customerId, requestedCurrency: currency });
      }
    }

    const metadata = {
      quote_id: quoteId,
      company_name: companyName,
      payment_type: paymentType,
      pricing_option: pricingOption || "N/A",
      installment_number: installmentNumber?.toString() || "N/A",
    };

    // Common checkout options for all payment types
    // Note: Stripe Checkout Sessions have a fixed max expiry of 24 hours — this cannot be extended
    const commonCheckoutOptions = {
      // Collect customer billing info
      billing_address_collection: 'required' as const,
      phone_number_collection: { enabled: true },
      // Custom fields for ABN
      custom_fields: [
        {
          key: 'company_name',
          label: { type: 'custom' as const, custom: 'Company Name' },
          type: 'text' as const,
        },
        {
          key: 'abn',
          label: { type: 'custom' as const, custom: 'ABN (Australian Business Number)' },
          type: 'text' as const,
          optional: true,
        },
      ],
    };

    if (paymentType === "slot_reservation") {
      // Slot reservation - dynamic amount based on setup fee
      // Frontend sends the deposit amount in cents via the `amount` field
      const slotAmount = (amount && amount > 0) ? amount : 500000; // Default $5,000 in cents
      logStep("Creating slot reservation checkout", { currency, slotAmount });
      const slotAmountFormatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
      }).format(slotAmount / 100);

      const slotProductName = `Production Slot Reservation - ${companyName}`;
      const gstLineItem = createGstLineItem(slotAmount, currency, slotProductName, quoteId, companyName);
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: slotProductName,
              description: `Secure your production slot for AI implementation. ${slotAmountFormatted} ${taxLabel}. This deposit confirms your place in our implementation schedule.`,
              metadata: {
                quote_id: quoteId,
                company_name: companyName,
              },
            },
            unit_amount: slotAmount,
          },
          quantity: 1,
        },
      ];
      if (gstLineItem) lineItems.push(gstLineItem);

      const totalAmountCents = slotAmount + (gstLineItem ? Math.round(slotAmount * GST_RATE) : 0);

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        ...commonCheckoutOptions,
        customer: customerId,
        line_items: lineItems,
        mode: "payment",
        metadata,
        // Auto-generate invoice after payment
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: `AlfredAI Production Slot Reservation${currency === 'aud' ? ' (incl. GST)' : ` (${taxLabel})`}`,
            metadata,
            footer: `Thank you for choosing AlfredAI! ${currency === 'aud' ? 'GST of 10% has been included.' : `All prices ${taxLabel}.`} For support: ${HELLO_EMAIL} | ${PRODUCTION_URL.replace('https://', '')}`,
          },
        },
        success_url: `${origin}/payment/thank-you?type=slot&quote=${quoteId}`,
        cancel_url: `${origin}/explained/pricing/diy-quote?payment=cancelled&quote=${quoteId}`,
        payment_intent_data: {
          metadata,
          description: `Production Slot Reservation - ${companyName} (Quote: ${quoteId}) ${currency === 'aud' ? 'incl. GST' : taxLabel}`,
        },
      };
      
      // Only set customer_email if not using existing customer and email is valid
      if (!customerId && validEmail) {
        sessionConfig.customer_email = validEmail;
      }

      debugGstOnLineItems("slot_reservation", paymentType, currency, "payment", lineItems);
      checkoutSession = await stripe.checkout.sessions.create(sessionConfig);

    } else if (paymentType === "setup_fee" || paymentType.startsWith("setup_")) {
      // Setup fee - one-time payment (full or installment)
      if (!amount || amount <= 0) {
        throw new Error(`Amount required for ${paymentType}`);
      }

      // Check if this is an installment payment
      const installmentConfig = INSTALLMENT_CONFIG[paymentType];
      const isInstallment = !!installmentConfig;

      logStep(`Creating ${paymentType} checkout (one-time${isInstallment ? ' installment' : ''})`, { amount, currency, isInstallment });

      const amountFormatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
      }).format(amount / 100);

      // Generate product name and description based on payment type
      let productName: string;
      let productDescription: string;

      if (isInstallment) {
        productName = `AI Implementation - ${installmentConfig.label} - ${companyName}`;
        const baseDesc = `${installmentConfig.label} for AI agent implementation. Part ${installmentConfig.installmentNumber} of ${installmentConfig.totalParts ?? 4} payments. Option A pricing for ${companyName}. ${amountFormatted} ${taxLabel}.`;
        // Add note for initiation fee explaining slot reservation deduction
        const initiationNote = installmentConfig.descriptionNote ? ` ${installmentConfig.descriptionNote}` : '';
        productDescription = description || `${baseDesc}${initiationNote}`;
      } else {
        productName = `AI Implementation & Setup Fee - ${companyName}`;
        productDescription = description || `Complete AI agent implementation including discovery, configuration, integration, testing, and team training. Option ${pricingOption || 'A'} pricing for ${companyName}. ${amountFormatted} ${taxLabel}. Includes 30-day post-launch support.`;
      }

      const setupGstLineItem = createGstLineItem(amount, currency, productName, quoteId, companyName);
      const setupLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: productName,
              description: productDescription,
              metadata: {
                quote_id: quoteId,
                company_name: companyName,
                installment_type: isInstallment ? paymentType.replace('setup_', '') : 'full',
                installment_number: installmentConfig?.installmentNumber?.toString() || 'N/A',
              },
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ];
      if (setupGstLineItem) setupLineItems.push(setupGstLineItem);

      const setupSessionConfig: Stripe.Checkout.SessionCreateParams = {
        ...commonCheckoutOptions,
        customer: customerId,
        line_items: setupLineItems,
        mode: "payment",
        metadata: {
          ...metadata,
          installment_type: isInstallment ? paymentType.replace('setup_', '') : 'full',
        },
        // Auto-generate invoice after payment
        invoice_creation: {
          enabled: true,
          invoice_data: {
            description: isInstallment 
              ? `AlfredAI Implementation - ${installmentConfig.label}${currency === 'aud' ? ' (incl. GST)' : ` (${taxLabel})`}`
              : `AlfredAI Implementation Setup Fee${currency === 'aud' ? ' (incl. GST)' : ` (${taxLabel})`}`,
            metadata,
            footer: `Thank you for choosing AlfredAI! ${currency === 'aud' ? 'GST of 10% has been included.' : `All prices ${taxLabel}.`} For support: ${HELLO_EMAIL} | ${PRODUCTION_URL.replace('https://', '')}`,
          },
        },
        success_url: `${origin}/payment/thank-you?type=${paymentType}&quote=${quoteId}`,
        cancel_url: `${origin}/explained/pricing/diy-quote?payment=cancelled&quote=${quoteId}`,
        payment_intent_data: {
          metadata: {
            ...metadata,
            installment_type: isInstallment ? paymentType.replace('setup_', '') : 'full',
          },
          description: `${productName} (Quote: ${quoteId}) ${currency === 'aud' ? 'incl. GST' : taxLabel}`,
        },
      };
      
      // Only set customer_email if not using existing customer and email is valid
      if (!customerId && validEmail) {
        setupSessionConfig.customer_email = validEmail;
      }

      debugGstOnLineItems(`setup:${paymentType}`, paymentType, currency, "payment", setupLineItems);
      checkoutSession = await stripe.checkout.sessions.create(setupSessionConfig);

    } else if (paymentType === "monthly_retainer") {
      // Monthly retainer - SUBSCRIPTION (recurring monthly)
      if (!amount || amount <= 0) {
        throw new Error("Amount required for monthly_retainer");
      }

      logStep("Creating monthly_retainer checkout (SUBSCRIPTION)", { amount, currency });

      const amountFormatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
      }).format(amount / 100);

      const retainerProductName = `Monthly AI Partnership Retainer - ${companyName}`;
      // For subscriptions, GST must be included in the unit_amount since we can't mix recurring/non-recurring line items
      const gstAmount = currency === 'aud' ? Math.round(amount * GST_RATE) : 0;
      const totalRetainerAmount = amount + gstAmount;
      
      const totalAmountFormatted = new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
      }).format(totalRetainerAmount / 100);

      const retainerDescription = description || `Ongoing AI operations, monitoring, optimization, and priority support for ${companyName}. ${amountFormatted}/month ${currency === 'aud' ? `+ GST ($${(gstAmount / 100).toLocaleString()} GST = ${totalAmountFormatted} total)` : taxLabel}. This is a MONTHLY RECURRING subscription as per the agreed quote, proposal, and service agreement. Billed automatically each month. Cancellation/Termination policy as per Agreement/Contract.`;

      const subscriptionSessionConfig: Stripe.Checkout.SessionCreateParams = {
        ...commonCheckoutOptions,
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: retainerProductName,
                description: retainerDescription,
                metadata: {
                  quote_id: quoteId,
                  company_name: companyName,
                  gst_included: currency === 'aud' ? 'true' : 'false',
                  base_amount: amount.toString(),
                  gst_amount: gstAmount.toString(),
                },
              },
              unit_amount: totalRetainerAmount,
              recurring: {
                interval: "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata,
        // Custom text on checkout page explaining recurring payment
        custom_text: {
          submit: {
            message: currency === 'aud'
              ? `By subscribing, you agree to be charged ${totalAmountFormatted}/month (incl. GST) as per the agreed quote, proposal, terms and service agreement. Base: ${amountFormatted} + GST: $${(gstAmount / 100).toLocaleString()}. Cancellation/Termination policy as per Agreement/Contract.`
              : `By subscribing, you agree to be charged ${amountFormatted}/month (${taxLabel}) as per the agreed quote, proposal, terms and service agreement. This is a recurring monthly subscription. Cancellation/Termination policy as per Agreement/Contract.`,
          },
          after_submit: {
            message: currency === 'aud'
              ? `Your monthly AI partnership subscription is now active. You will be invoiced ${totalAmountFormatted}/month (incl. GST) automatically. Cancellation/Termination policy as per Agreement/Contract.`
              : `Your monthly AI partnership subscription is now active. You will receive an invoice for ${amountFormatted} (${taxLabel}) each month automatically. Cancellation/Termination policy as per Agreement/Contract.`,
          },
        },
        subscription_data: {
          metadata,
          description: `Monthly AI Partnership - ${companyName} (Quote: ${quoteId}) ${currency === 'aud' ? 'incl. GST' : taxLabel}`,
        },
        success_url: `${origin}/payment/thank-you?type=monthly_retainer&quote=${quoteId}`,
        cancel_url: `${origin}/explained/pricing/diy-quote?payment=cancelled&quote=${quoteId}`,
      };
      
      // Only set customer_email if not using existing customer and email is valid
      if (!customerId && validEmail) {
        subscriptionSessionConfig.customer_email = validEmail;
      }

      debugGstOnLineItems(
        "monthly_retainer",
        paymentType,
        currency,
        "subscription",
        subscriptionSessionConfig.line_items as Stripe.Checkout.SessionCreateParams.LineItem[],
      );
      checkoutSession = await stripe.checkout.sessions.create(subscriptionSessionConfig);

    } else {
      throw new Error(`Invalid payment type: ${paymentType}`);
    }

    logStep("Checkout session created", {
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
      mode: checkoutSession.mode,
    });

    // GST_DEBUG: re-fetch session line items from Stripe to confirm what was actually persisted
    try {
      const expanded = await stripe.checkout.sessions.listLineItems(checkoutSession.id, { limit: 10, expand: ["data.price.product"] });
      const persisted: { description?: string | null; product_name?: string | null }[] = expanded.data.map((li: Stripe.LineItem) => ({
        description: li.description,
        amount_subtotal: li.amount_subtotal,
        amount_tax: li.amount_tax,
        amount_total: li.amount_total,
        currency: li.currency,
        quantity: li.quantity,
        price_recurring: li.price?.recurring ?? null,
        product_name: typeof li.price?.product === "object" && li.price?.product && "name" in li.price.product
          ? (li.price.product as Stripe.Product).name
          : null,
      }));
      const gstLinePresent = persisted.some((p) => /\bGST\b/i.test(p.description ?? "") || /\bGST\b/i.test(p.product_name ?? ""));
      logStep("GST_DEBUG ◀ persisted Stripe line items", {
        session_id: checkoutSession.id,
        currency,
        payment_type: paymentType,
        gst_line_present_in_stripe: gstLinePresent,
        gst_strategy: currency !== "aud" ? "not_applicable" : (gstLinePresent ? "separate_line_item" : "bundled_in_unit_amount"),
        line_items: persisted,
      });
    } catch (debugErr) {
      logStep("GST_DEBUG: failed to fetch persisted line items", { error: String(debugErr) });
    }

    // Record payment link in database for tracking
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const basePaymentAmount = paymentType === "slot_reservation" 
        ? ((amount && amount > 0) ? amount : 500000)
        : (amount || 0);
      // Store GST-inclusive amount for AUD
      const gstOnPayment = currency === 'aud' ? Math.round(basePaymentAmount * GST_RATE) : 0;
      const paymentAmount = basePaymentAmount + gstOnPayment;

      // Determine installment type and number
      const installmentConfig = INSTALLMENT_CONFIG[paymentType];
      const installmentType = getInstallmentType(paymentType);

      // Normalize payment_type to DB-allowed values: slot_reservation, setup_fee, monthly_retainer
      // All setup installments (setup_initiation, setup_month1, etc.) are stored as 'setup_fee' with installment_type
      const dbPaymentType = paymentType.startsWith("setup_") ? "setup_fee" : paymentType;

      const { error: insertError } = await supabase
        .from("quote_payments")
        .insert({
          quote_id: quoteId,
          company_name: companyName,
          contact_email: validEmail,
          contact_name: contactName,
          payment_type: dbPaymentType,
          amount: paymentAmount,
          currency: currency,
          stripe_session_id: checkoutSession.id,
          pricing_option: pricingOption,
          payment_link_url: checkoutSession.url,
          status: "pending",
          installment_type: installmentType,
          installment_number: installmentConfig?.installmentNumber || null,
        });

      if (insertError) {
        logStep("Warning: Failed to record payment in database", { error: insertError });
      } else {
        logStep("Payment record created in database", { installmentType, installmentNumber: installmentConfig?.installmentNumber });
      }
    } catch (dbError) {
      logStep("Warning: Database error", { error: String(dbError) });
    }

    return new Response(
      JSON.stringify({ 
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
