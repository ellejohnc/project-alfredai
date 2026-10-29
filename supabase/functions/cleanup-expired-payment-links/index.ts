import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 60);
    const cutoffISO = cutoffDate.toISOString();

    console.log(`[cleanup] Deleting unused payment links created before ${cutoffISO}`);

    // Delete payment links that are still 'pending' and older than 60 days
    // Exclude 'completed', 'paid', 'processing' statuses
    const { data: deleted, error, count } = await supabase
      .from('quote_payments')
      .delete()
      .eq('status', 'pending')
      .is('completed_at', null)
      .lt('created_at', cutoffISO)
      .select('id, payment_type, quote_id, amount, created_at');

    if (error) {
      console.error('[cleanup] Delete error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const deletedCount = deleted?.length ?? 0;
    console.log(`[cleanup] Deleted ${deletedCount} expired payment links`);

    return new Response(JSON.stringify({
      success: true,
      deleted_count: deletedCount,
      cutoff_date: cutoffISO,
      deleted_links: deleted,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[cleanup] Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
