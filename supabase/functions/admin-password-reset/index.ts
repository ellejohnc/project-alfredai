import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PRODUCTION_URL } from "../_shared/config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  targetUserId: string;
  targetEmail: string;
  targetDisplayName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the auth token from the request to verify the requester
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create client with requester's auth to check permissions
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the requester is authenticated and get their user
    const { data: { user: requester }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !requester) {
      throw new Error("Unauthorized: Invalid auth token");
    }

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if requester has admin or super_admin role
    const { data: requesterRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requester.id)
      .maybeSingle();

    if (roleError) {
      console.error("Error checking role:", roleError);
      throw new Error("Failed to verify permissions");
    }

    const hasPermission = requesterRole?.role === "admin" || requesterRole?.role === "super_admin";
    if (!hasPermission) {
      throw new Error("Unauthorized: Admin or Super Admin role required");
    }

    const { targetUserId, targetEmail, targetDisplayName }: ResetPasswordRequest = await req.json();

    if (!targetUserId || !targetEmail) {
      throw new Error("Target user ID and email are required");
    }

    console.log(`Admin ${requester.email} requesting password reset for ${targetEmail}`);

    // Generate password reset link using Supabase Admin API
    const siteUrl = Deno.env.get("SITE_URL") || PRODUCTION_URL;
    const redirectTo = `${siteUrl}/admin/reset-password`;

    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: targetEmail,
      options: {
        redirectTo,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      throw new Error(`Failed to generate reset link: ${resetError.message}`);
    }

    // Prefer building our own link with the hashed token so the token is only
    // exchanged AFTER the user clicks "Proceed" on our confirmation page.
    // This prevents email security scanners from pre-clicking Supabase's
    // /verify endpoint and consuming the single-use token before the user does.
    const hashedToken = resetData?.properties?.hashed_token;
    const resetLink = hashedToken
      ? `${redirectTo}?token_hash=${hashedToken}&type=recovery`
      : resetData?.properties?.action_link;

    if (!resetLink) {
      throw new Error("Failed to generate reset link");
    }

    // Send the password reset email using the existing email function
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        email: targetEmail,
        resetLink,
        userName: targetDisplayName || targetEmail.split("@")[0],
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Error sending reset email:", errorText);
      throw new Error("Failed to send password reset email");
    }

    console.log(`Password reset email sent to ${targetEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
