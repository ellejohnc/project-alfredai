import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LeadData {
  lead_email: string;
  lead_name: string;
  lead_phone?: string;
  lead_company?: string;
  lead_turnover?: string;
  source_page: string;
  source_medium: string;
  source_campaign: string;
  lead_source: string;
  demo_title: string;
  demo_id: string;
  /** Browser visitor id, shared with demo_engagement.visitor_id so this lead
   *  can be joined to the engagement events that visitor produced. */
  visitor_id?: string;
  is_return_visit?: boolean;
  utm_data?: Record<string, string | undefined>;
}

async function processLeadInBackground(data: LeadData): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const isReturn = data.is_return_visit === true;
  console.log(`[queue-demo-lead] Processing ${isReturn ? 'return visit' : 'new lead'} for: ${data.lead_email}`);
  const startTime = Date.now();

  try {
    const isMetaAds = data.lead_source === 'meta_ads';
    
    if (isReturn && !isMetaAds) {
      // Return visit (non-Meta) - just log engagement, no new lead creation or email
      const supabase = createClient(supabaseUrl, serviceKey);
      
      const { error } = await supabase.from('demo_engagement').insert({
        demo_id: data.demo_id,
        event_type: 'return_access',
        metadata: {
          email: data.lead_email,
          name: data.lead_name,
          company: data.lead_company,
          demo_title: data.demo_title,
          source_page: data.source_page,
        },
      });
      
      const elapsed = Date.now() - startTime;
      if (error) {
        console.error(`[queue-demo-lead] Return visit logging failed after ${elapsed}ms:`, error);
      } else {
        console.log(`[queue-demo-lead] Logged return visit in ${elapsed}ms for: ${data.lead_email}`);
      }
      return;
    }
    
    // Meta ads bypass with unknown visitor - log engagement only (no valid email)
    if (isMetaAds && data.lead_email === 'meta_ads_visitor@unknown') {
      const supabase = createClient(supabaseUrl, serviceKey);
      
      await supabase.from('demo_engagement').insert({
        demo_id: data.demo_id,
        event_type: 'meta_ads_bypass',
        metadata: {
          demo_title: data.demo_title,
          source_page: data.source_page,
          utm_data: data.utm_data,
        },
      });
      
      console.log(`[queue-demo-lead] Logged Meta ads bypass (no identity) for demo: ${data.demo_id}`);
      return;
    }

    // First-time visit - full processing (DB + GHL + email notification)
    const response = await fetch(`${supabaseUrl}/functions/v1/log-ghl-submission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        lead_email: data.lead_email,
        lead_name: data.lead_name,
        lead_phone: data.lead_phone,
        lead_company: data.lead_company,
        source_page: data.source_page,
        source_medium: data.source_medium,
        source_campaign: data.source_campaign,
        lead_source: data.lead_source,
        visitor_id: data.visitor_id ?? null,
        ghl_status: "submitted",
        qualification_data: {
          demo_accessed: data.demo_title,
          demo_id: data.demo_id,
          annual_turnover: data.lead_turnover || undefined,
        },
        utm_data: data.utm_data,
      }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[queue-demo-lead] GHL sync failed after ${elapsed}ms:`, errorText);
      // Lead is already stored in localStorage on client side
      // Admin can see unsynced leads via ghl_submissions table status
    } else {
      console.log(`[queue-demo-lead] Successfully processed new lead in ${elapsed}ms`);
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[queue-demo-lead] Background processing error after ${elapsed}ms:`, error);
    // Graceful degradation - lead data is preserved client-side
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: LeadData = await req.json();

    // Basic validation only - keep it fast
    if (!body.lead_email || !body.lead_name) {
      console.warn('[queue-demo-lead] Missing required fields:', { 
        hasEmail: !!body.lead_email, 
        hasName: !!body.lead_name 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: lead_email and lead_name' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const isReturn = body.is_return_visit === true;
    console.log(`[queue-demo-lead] Queuing ${isReturn ? 'return visit' : 'lead'}: ${body.lead_email} for demo: ${body.demo_id}`);

    // Start background processing (non-blocking)
    // EdgeRuntime.waitUntil keeps the function alive until the promise resolves
    EdgeRuntime.waitUntil(processLeadInBackground(body));

    // Return immediately - visitor can access demo now (<100ms)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isReturn ? 'Return visit queued' : 'Lead queued for processing' 
      }),
      { 
        status: 202, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('[queue-demo-lead] Request parsing error:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
