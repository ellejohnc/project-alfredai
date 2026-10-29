import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LogGuideAccessRequest {
  guideId: string;
  guideTitle: string;
  userEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { guideId, guideTitle, userEmail, userName }: LogGuideAccessRequest = await req.json();

    console.log(`Logging guide access: ${userEmail} accessed "${guideTitle}"`);

    // Create Supabase client with service role for inserting activity logs
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Insert activity log entry
    const { error } = await supabaseAdmin.from("activity_logs").insert({
      user_id: "00000000-0000-0000-0000-000000000000", // Anonymous/public user placeholder
      user_email: userEmail,
      action: "access_gated_guide",
      resource_type: "guide",
      resource_id: guideId,
      resource_name: guideTitle,
      details: {
        user_name: userName,
        access_type: "gated_content",
        timestamp: new Date().toISOString()
      },
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null
    });

    if (error) {
      console.error("Error logging guide access:", error);
      // Don't fail the request if logging fails
    } else {
      console.log("Guide access logged successfully");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in log-guide-access function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
