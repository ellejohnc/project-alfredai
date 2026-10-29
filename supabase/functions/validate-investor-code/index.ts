import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Master access codes are read from a secret (comma-separated), never hardcoded.
const MASTER_ACCESS_CODES = (Deno.env.get("INVESTOR_MASTER_CODES") ?? "")
  .split(",")
  .map((c) => c.trim())
  .filter((c) => c.length > 0);

interface ValidateRequest {
  access_code: string;
}

// Helper function to log access code usage
async function logCodeUsage(
  supabase: any,
  investorId: string | null,
  accessCode: string,
  isMasterCode: boolean,
  ipAddress: string | null,
  userAgent: string | null
) {
  try {
    await supabase.from("investor_code_usage").insert({
      investor_id: investorId,
      access_code: accessCode,
      is_master_code: isMasterCode,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    console.log("validate-investor-code: Usage logged successfully");
  } catch (error) {
    console.error("validate-investor-code: Failed to log usage:", error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("validate-investor-code: Request received");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_code }: ValidateRequest = await req.json();
    console.log("validate-investor-code: Validating code");

    if (!access_code) {
      return new Response(
        JSON.stringify({ valid: false, error: "Access code is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedCode = access_code.trim();

    // Get IP and user agent for logging
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                      req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for master access code
    if (MASTER_ACCESS_CODES.includes(normalizedCode) || MASTER_ACCESS_CODES.includes(normalizedCode.toUpperCase())) {
      console.log("validate-investor-code: Master access code used");
      
      // Log master code usage
      await logCodeUsage(supabase, null, "MASTER", true, ipAddress, userAgent);
      
      return new Response(
        JSON.stringify({
          valid: true,
          investor: {
            id: "master",
            fullName: "Admin Access",
            email: "admin@alfred.ai",
            firmName: "AlfredAI",
            role: "Owner",
            investmentFocus: "All",
            typicalCheckSize: null,
            expiresAt: null,
            isMaster: true
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const normalizedUpperCode = normalizedCode.toUpperCase();

    // Look up the access code in investor_leads
    const { data: investor, error } = await supabase
      .from("investor_leads")
      .select("*")
      .eq("access_code", normalizedUpperCode)
      .eq("status", "approved")
      .maybeSingle();

    if (error) {
      console.error("validate-investor-code: Database error:", error);
      return new Response(
        JSON.stringify({ valid: false, error: "Failed to validate code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!investor) {
      console.log("validate-investor-code: Invalid code");
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid access code" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if code has expired
    if (investor.access_code_expires_at) {
      const expiresAt = new Date(investor.access_code_expires_at);
      if (expiresAt < new Date()) {
        console.log("validate-investor-code: Code expired");
        return new Response(
          JSON.stringify({ valid: false, error: "Access code has expired. Please contact us for a new code." }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log("validate-investor-code: Code is valid for investor:", investor.full_name);

    // Log successful access code usage
    await logCodeUsage(supabase, investor.id, normalizedUpperCode, false, ipAddress, userAgent);

    // Return investor details for session
    return new Response(
      JSON.stringify({
        valid: true,
        investor: {
          id: investor.id,
          fullName: investor.full_name,
          email: investor.email,
          firmName: investor.firm_name,
          role: investor.role,
          investmentFocus: investor.investment_focus,
          typicalCheckSize: investor.typical_check_size,
          expiresAt: investor.access_code_expires_at
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("validate-investor-code: Error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message || "Failed to validate code" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
