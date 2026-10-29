import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateRequest {
  quoteId: string;
  updates: {
    transcript_summary?: string;
    notes?: string;
    workflows?: any[];
    challenges?: string[];
    setup_fee_min?: number;
    setup_fee_max?: number;
    monthly_retainer_min?: number;
    monthly_retainer_max?: number;
    setup_fee_final?: number;
    monthly_retainer_final?: number;
    voice_agent_plan?: string;
    voice_agent_monthly_cost?: number;
    voice_agent_setup_cost?: number;
    current_tech_stack?: any;
    roi_conservative?: number;
    roi_likely?: number;
    roi_best?: number;
  };
  editorEmail: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { quoteId, updates, editorEmail, skipVersioning } = body;

    if (!quoteId || !updates) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleRows } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = (roleRows || []).map((r: { role: string }) => r.role);
    if (!roles.some((r) => ['admin', 'super_admin', 'editor'].includes(r))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_id', quoteId.toUpperCase())
      .maybeSingle();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Don't allow editing signed quotes
    if (quote.signed_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cannot edit a signed proposal' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save version history unless skipVersioning is set (used for reset operations)
    let nextVersion = 0;
    if (!skipVersioning) {
      // Get current version number
      const { data: versions } = await supabase
        .from('quote_versions')
        .select('version_number')
        .eq('quote_id', quote.id)
        .order('version_number', { ascending: false })
        .limit(1);

      nextVersion = (versions?.[0]?.version_number || 0) + 1;

      // Save current state as a version
      await supabase
        .from('quote_versions')
        .insert({
          quote_id: quote.id,
          version_number: nextVersion,
          company_name: quote.company_name,
          contact_name: quote.contact_name,
          contact_email: quote.contact_email,
          industry: quote.industry,
          team_size: quote.team_size,
          workflows: quote.workflows,
          challenges: quote.challenges,
          timeline: quote.timeline,
          notes: quote.notes,
          transcript_summary: quote.transcript_summary,
          setup_fee_min: quote.setup_fee_min,
          setup_fee_max: quote.setup_fee_max,
          setup_fee_final: quote.setup_fee_final,
          monthly_retainer_min: quote.monthly_retainer_min,
          monthly_retainer_max: quote.monthly_retainer_max,
          monthly_retainer_final: quote.monthly_retainer_final,
          roi_conservative: quote.roi_conservative,
          roi_likely: quote.roi_likely,
          roi_best: quote.roi_best,
          voice_agent_plan: quote.voice_agent_plan,
          voice_agent_monthly_cost: quote.voice_agent_monthly_cost,
          voice_agent_setup_cost: quote.voice_agent_setup_cost,
          voice_agent_workflow_count: quote.voice_agent_workflow_count,
          sentiment_analysis: quote.sentiment_analysis,
          current_tech_stack: quote.current_tech_stack,
          meeting_transcript: quote.meeting_transcript,
          created_by: editorEmail || user.email,
          change_summary: 'Inline edit from proposal page'
        });
    }

    // Update the quote with new values
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        ...updates,
        last_edited_at: new Date().toISOString(),
        last_edited_by: editorEmail || user.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', quote.id);

    if (updateError) {
      console.error('[update-proposal-content] Error updating quote:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update proposal' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get updated quote
    const { data: updatedQuote } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quote.id)
      .single();

    console.log(`[update-proposal-content] Quote ${quoteId} updated by ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        quote: updatedQuote,
        versionNumber: nextVersion
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[update-proposal-content] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});