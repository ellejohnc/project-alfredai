import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PRODUCTION_URL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Generic response — never reveal whether an account exists.
  const genericSuccess = () =>
    new Response(
      JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { email }: RequestBody = await req.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      // Still return generic success to avoid enumeration.
      return genericSuccess();
    }

    const normalisedEmail = email.trim().toLowerCase();
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const siteUrl = Deno.env.get("SITE_URL") || PRODUCTION_URL;
    const redirectTo = `${siteUrl}/admin/reset-password`;

    // Generate a real recovery link with a single-use token.
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: normalisedEmail,
      options: { redirectTo },
    });

    if (resetError) {
      // Most commonly: user does not exist. Return generic success.
      console.log("generateLink note:", resetError.message);
      return genericSuccess();
    }

    // Build our own link with the hashed token so the token is only exchanged
    // AFTER the user submits the reset form (prevents scanners burning it).
    const hashedToken = resetData?.properties?.hashed_token;
    const resetLink = hashedToken
      ? `${redirectTo}?token_hash=${hashedToken}&type=recovery`
      : resetData?.properties?.action_link;

    if (!resetLink) {
      console.error("No reset link generated");
      return genericSuccess();
    }

    // Send the custom styled email.
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email: normalisedEmail,
        resetLink,
        userName: normalisedEmail.split("@")[0],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Error sending reset email:", errorText);
    }

    return genericSuccess();
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    // Fail-safe generic success to avoid leaking internal state.
    return new Response(
      JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
