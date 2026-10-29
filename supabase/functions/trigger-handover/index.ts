import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HandoverRequest {
  quoteId: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  assignedTo?: string;
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as HandoverRequest;
    const { quoteId, priority = 'normal', notes, assignedTo } = body;

    if (!quoteId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || !['admin', 'super_admin'].includes(roleData.role)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('quote_id', quoteId.toUpperCase())
      .maybeSingle();

    if (quoteError || !quote) {
      return new Response(
        JSON.stringify({ success: false, error: 'Quote not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if handover already exists
    const { data: existingHandover } = await supabase
      .from('handover_requests')
      .select('id, status, notes')
      .eq('quote_id', quote.id)
      .maybeSingle();

    if (existingHandover) {
      // Update existing handover
      const { error: updateError } = await supabase
        .from('handover_requests')
        .update({
          priority,
          notes: notes || (existingHandover as any).notes,
          assigned_to: assignedTo,
          status: assignedTo ? 'assigned' : existingHandover.status
        })
        .eq('id', existingHandover.id);

      if (updateError) {
        console.error('[trigger-handover] Error updating handover:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update handover' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Create new handover request
      const { error: insertError } = await supabase
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
          priority,
          notes,
          assigned_to: assignedTo,
          status: assignedTo ? 'assigned' : 'pending'
        });

      if (insertError) {
        console.error('[trigger-handover] Error creating handover:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create handover' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update quote handover status
    await supabase
      .from('quotes')
      .update({
        handover_status: 'triggered',
        handover_triggered_at: new Date().toISOString(),
        handover_notes: notes
      })
      .eq('id', quote.id);

    console.log(`[trigger-handover] Handover triggered for quote ${quoteId} by ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Handover triggered successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[trigger-handover] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
