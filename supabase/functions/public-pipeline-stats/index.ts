import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Public aggregate of the live sales pipeline. Returns ONLY a single summed
// number — no row-level/company data is exposed. Mirrors the admin Sales
// Figures "Pipeline value" logic (sum of sent quotes' setup + monthly).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data, error } = await supabase
      .from("quotes")
      .select(
        "status, setup_fee_final, setup_fee_max, setup_fee_min, monthly_retainer_final, monthly_retainer_max, monthly_retainer_min",
      )
      .eq("status", "sent");

    if (error) throw error;

    const pipelineValue = (data ?? []).reduce((sum, q) => {
      const setup =
        q.setup_fee_final || q.setup_fee_max || q.setup_fee_min || 0;
      const monthly =
        q.monthly_retainer_final ||
        q.monthly_retainer_max ||
        q.monthly_retainer_min ||
        0;
      return sum + setup + monthly;
    }, 0);

    return new Response(
      JSON.stringify({
        success: true,
        pipelineValue,
        count: data?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("public-pipeline-stats error", e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        pipelineValue: null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
