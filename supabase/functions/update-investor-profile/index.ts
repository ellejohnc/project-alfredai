import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateRequest {
  investorId: string;
  accessCode: string;
  fullName: string;
  checkSize?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("update-investor-profile: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { investorId, accessCode, fullName, checkSize }: UpdateRequest = await req.json();
    console.log("update-investor-profile: Updating for investor:", investorId);

    if (!investorId || !accessCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the access code matches the investor
    const { data: investor, error: fetchError } = await supabase
      .from("investor_leads")
      .select("id, access_code")
      .eq("id", investorId)
      .eq("status", "approved")
      .maybeSingle();

    if (fetchError || !investor) {
      console.error("update-investor-profile: Investor not found:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Investor not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify access code
    if (investor.access_code?.toUpperCase() !== accessCode.toUpperCase()) {
      console.log("update-investor-profile: Access code mismatch");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid access code" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the investor profile (only allowed fields - name and check size)
    const { error: updateError } = await supabase
      .from("investor_leads")
      .update({
        full_name: fullName,
        typical_check_size: checkSize || null,
      })
      .eq("id", investorId);

    if (updateError) {
      console.error("update-investor-profile: Update error:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update profile" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("update-investor-profile: Profile updated successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("update-investor-profile: Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Failed to update profile" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
