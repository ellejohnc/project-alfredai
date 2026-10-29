import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePasswordRequest {
  targetUserId: string;
  newPassword: string;
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

    // Verify the requester is authenticated
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

    const { targetUserId, newPassword }: UpdatePasswordRequest = await req.json();

    if (!targetUserId || !newPassword) {
      throw new Error("Target user ID and new password are required");
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Get target user info for logging
    const { data: targetUser } = await supabaseAdmin
      .from("admin_users")
      .select("email, role")
      .eq("id", targetUserId)
      .maybeSingle();

    // Check if admin can update this user's password
    // Super admins can update anyone, admins can only update editors and themselves
    if (requesterRole?.role === "admin" && targetUser?.role !== "editor" && targetUserId !== requester.id) {
      throw new Error("Admins can only change passwords for editors or themselves");
    }

    console.log(`Admin ${requester.email} updating password for user ${targetUser?.email || targetUserId}`);

    // Update the user's password using Supabase Admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUserId,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error(`Failed to update password: ${updateError.message}`);
    }

    console.log(`Password updated successfully for ${targetUser?.email || targetUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-update-password:", error);
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
