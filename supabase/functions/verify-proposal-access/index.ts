import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Valid workflow IDs - must match workflowDefinitions in frontend
const VALID_WORKFLOW_IDS = new Set([
  'workflow-builder', 'knowledge-intelligence', 'knowledge-synthesis',
  'business-operations', 'consultant-decision-support', 'inventory-asset-tracking',
  'smart-warehouse', 'customer-experience', 'butler-voice', 'voice-agent',
  'voice-operations', 'marketplace', 'property-management', 'subcontractor-assignment',
  'rfi-management', 'fee-proposal', 'contract-review', 'smart-quote-builder',
  'site-inspection', 'procurement', 'tender-management', 'candidate-match',
  'interview-scoring', 'lead-research', 'ai-crm-insights', 'auto-invoicing',
  'invoice-processing', 'purchase-bill-intake', 'patient-engagement',
  'insurance-broker', 'business-matchmaker', 'law-firm-os', 'trades-platform',
  'event-seating', 'drawings-to-estimate', 'vendor-compliance', 'alfred-bid',
  'timber-flooring-quote', 'technical-report-agent'
]);

interface VerifyRequest {
  quoteId: string;
  accessCode?: string;
  mode?: 'lookup' | 'verify';
}

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
}

// In-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; attemptsRemaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry) {
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS };
  }
  
  // Reset if window expired
  if (now - entry.lastAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(ip);
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS };
  }
  
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - entry.attempts);
  return { allowed: entry.attempts < MAX_ATTEMPTS, attemptsRemaining };
}

function recordAttempt(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now - entry.lastAttempt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { attempts: 1, lastAttempt: now });
  } else {
    rateLimitMap.set(ip, { attempts: entry.attempts + 1, lastAttempt: now });
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quoteId, accessCode, mode = 'verify' } = await req.json() as VerifyRequest;

    // Validate quoteId (required for both modes)
    if (!quoteId || typeof quoteId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[verify-proposal-access] Missing Supabase configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ===== LOOKUP MODE: Return only company_name (no auth required) =====
    if (mode === 'lookup') {
      const { data: lookupData, error: lookupError } = await supabase
        .from('quotes')
        .select('company_name')
        .eq('quote_id', quoteId.toUpperCase())
        .maybeSingle();

      if (lookupError) {
        console.error('[verify-proposal-access] Lookup error:', lookupError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to look up proposal' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!lookupData) {
        return new Response(
          JSON.stringify({ success: false, found: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, found: true, companyName: lookupData.company_name }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== VERIFY MODE: Full access code verification =====
    // Use trusted IP source only (CF-Connecting-IP from Cloudflare, fallback to x-real-ip)
    const clientIp = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    const { allowed, attemptsRemaining } = checkRateLimit(clientIp);
    if (!allowed) {
      console.log(`[verify-proposal-access] Rate limited: ${clientIp.substring(0, 8)}...`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Too many failed attempts. Please try again later.',
          attemptsRemaining: 0,
          rateLimited: true
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!accessCode || typeof accessCode !== 'string' || accessCode.length !== 6) {
      recordAttempt(clientIp);
      const remaining = Math.max(0, attemptsRemaining - 1);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid access code format',
          attemptsRemaining: remaining 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up quote by quote_id (human-readable ID)
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        id,
        quote_id,
        access_code,
        company_name,
        contact_name,
        contact_email,
        industry,
        team_size,
        workflows,
        challenges,
        timeline,
        notes,
        handover_notes,
        transcript_summary,
        setup_fee_min,
        setup_fee_max,
        setup_fee_final,
        monthly_retainer_min,
        monthly_retainer_max,
        monthly_retainer_final,
        roi_conservative,
        roi_likely,
        roi_best,
        payback_months_conservative,
        payback_months_likely,
        payback_months_best,
        voice_agent_plan,
        voice_agent_monthly_cost,
        voice_agent_setup_cost,
        voice_agent_workflow_count,
        voice_agent_addons,
        sentiment_analysis,
        current_tech_stack,
        meeting_transcript,
        status,
        signed_at,
        signed_by_name,
        bundle_pricing,
        pricing_option,
        contract_months,
        poc_requested,
        created_at,
        created_by
      `)
      .eq('quote_id', quoteId.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('[verify-proposal-access] Database error:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to verify access' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!quote) {
      recordAttempt(clientIp);
      const remaining = Math.max(0, attemptsRemaining - 1);
      console.log(`[verify-proposal-access] Quote not found: ${quoteId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid quote ID or access code',
          attemptsRemaining: remaining
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify access code (quote-specific code only - no master bypass)
    if (quote.access_code !== accessCode) {
      recordAttempt(clientIp);
      const remaining = Math.max(0, attemptsRemaining - 1);
      console.log(`[verify-proposal-access] Invalid access code for quote: ${quoteId}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid access code',
          attemptsRemaining: remaining
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Access granted - return quote data (without access_code)
    console.log(`[verify-proposal-access] Access granted for quote: ${quoteId}`);
    
    // Track proposal view for analytics
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    const sessionId = req.headers.get('x-session-id') || crypto.randomUUID();
    
    // Detect device type
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent);
    const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
    
    // Hash IP for privacy
    const ipHash = clientIp !== 'unknown' 
      ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clientIp))
          .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16))
      : null;
    
    // Check if this is the first view for this quote
    const { count: existingViews } = await supabase
      .from('proposal_views')
      .select('*', { count: 'exact', head: true })
      .eq('quote_id', quote.id);
    
    // Detect admin view (referrer from admin panel)
    const isAdminView = /\/admin\//i.test(referrer);

    // Insert view record
    await supabase
      .from('proposal_views')
      .insert({
        quote_id: quote.id,
        ip_hash: ipHash,
        user_agent: userAgent.slice(0, 500),
        referrer: referrer.slice(0, 500),
        device_type: deviceType,
        is_first_view: existingViews === 0,
        session_id: sessionId,
        is_admin_view: isAdminView
      });
    
    console.log(`[verify-proposal-access] View tracked for quote: ${quoteId}, device: ${deviceType}, first: ${existingViews === 0}`);
    
    // Remove access_code and internal sales-intelligence fields from response
    const {
      access_code: _,
      meeting_transcript: _mt,
      transcript_summary: _ts,
      sentiment_analysis: _sa,
      notes: _n,
      handover_notes: _hn,
      ...safeQuoteData
    } = quote;
    
    // Server-side workflow validation: filter out any invalid workflow IDs
    // while preserving custom workflow objects ({ custom: true, name, setupFee, monthlyFee, ... })
    if (safeQuoteData.workflows && Array.isArray(safeQuoteData.workflows)) {
      const originalCount = safeQuoteData.workflows.length;
      const validWorkflows = safeQuoteData.workflows.filter((w: unknown) => {
        if (typeof w === 'string') return VALID_WORKFLOW_IDS.has(w);
        if (w && typeof w === 'object' && (w as any).custom === true) return true;
        return false;
      });

      if (validWorkflows.length !== originalCount) {
        const invalidIds = safeQuoteData.workflows.filter((w: unknown) =>
          !(typeof w === 'string' ? VALID_WORKFLOW_IDS.has(w) : (w && typeof w === 'object' && (w as any).custom === true))
        );
        console.warn(`[verify-proposal-access] Filtered ${originalCount - validWorkflows.length} invalid workflow(s):`, invalidIds);
      }

      safeQuoteData.workflows = validWorkflows;
      console.log(`[verify-proposal-access] Returning ${validWorkflows.length} valid workflow(s) (incl. custom)`);
    }

    // Fetch payment links for this quote (server-side, not exposed via public RLS)
    let paymentLinks: any[] = [];
    try {
      const { data: allLinks } = await supabase
        .from('quote_payments')
        .select('id, payment_type, amount, currency, payment_link_url, installment_type, status, client_confirmed_at, completed_at, created_at')
        .eq('quote_id', quote.quote_id)
        .in('status', ['pending', 'completed', 'clicked'])
        .order('created_at', { ascending: false });

      if (allLinks && allLinks.length > 0) {
        // Keep the LATEST row per payment type/installment across the whole
        // history. The previous 60s "same batch" window silently dropped whole
        // payment types (e.g. slot_reservation generated separately from the
        // setup instalments), which made the PoC reservation section vanish
        // from the proposal. Dedupe only — never drop a payment type.
        const uniqueLinks = new Map<string, typeof allLinks[0]>();
        for (const link of allLinks) {
          const dedupKey = link.installment_type
            ? `${link.payment_type}:${link.installment_type}`
            : link.payment_type;
          if (!uniqueLinks.has(dedupKey)) {
            uniqueLinks.set(dedupKey, link);
          }
        }

        paymentLinks = Array.from(uniqueLinks.values());
        console.log(`[verify-proposal-access] Payment links: ${allLinks.length} total -> ${paymentLinks.length} unique types`);
      }

    } catch (payErr) {
      console.error('[verify-proposal-access] Error fetching payment links:', payErr);
      // Non-fatal - proposal can still load without payment links
    }

    return new Response(
      JSON.stringify({
        success: true,
        quote: safeQuoteData,
        paymentLinks
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    console.error('[verify-proposal-access] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
