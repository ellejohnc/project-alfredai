import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyRequest {
  email: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("verify-investor-code: Request received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code }: VerifyRequest = await req.json();
    console.log("verify-investor-code: Verifying code for email:", email);

    if (!email || !code) {
      console.error("verify-investor-code: Email and code are required");
      return new Response(
        JSON.stringify({ error: "Email and code are required", verified: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the verification code
    const { data: verificationRecord, error: selectError } = await supabase
      .from("investor_verification_codes")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("code", code.trim())
      .is("verified_at", null)
      .single();

    if (selectError || !verificationRecord) {
      console.error("verify-investor-code: Invalid or expired code:", selectError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid verification code. Please check and try again.", 
          verified: false 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code has expired
    const expiresAt = new Date(verificationRecord.expires_at);
    if (expiresAt < new Date()) {
      console.error("verify-investor-code: Code has expired");
      return new Response(
        JSON.stringify({ 
          error: "Verification code has expired. Please request a new one.", 
          verified: false,
          expired: true
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark the code as verified
    const { error: updateError } = await supabase
      .from("investor_verification_codes")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verificationRecord.id);

    if (updateError) {
      console.error("verify-investor-code: Error updating verification status:", updateError);
    }

    console.log("verify-investor-code: Code verified successfully for:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true, 
        message: "Email verified successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("verify-investor-code: Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Verification failed", verified: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
