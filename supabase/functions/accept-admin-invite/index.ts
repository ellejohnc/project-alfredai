import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInviteRequest {
  token: string;
  password: string;
  displayName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, password, displayName }: AcceptInviteRequest = await req.json();

    if (!token || !password || !displayName) {
      throw new Error("Token, password, and display name are required");
    }

    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("pending_invitations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invitation) {
      throw new Error("Invalid or expired invitation");
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Delete expired invitation
      await supabase.from("pending_invitations").delete().eq("id", invitation.id);
      throw new Error("This invitation has expired");
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("email", invitation.email)
      .maybeSingle();

    if (existingUser) {
      await supabase.from("pending_invitations").delete().eq("id", invitation.id);
      throw new Error("An account with this email already exists");
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      throw new Error(authError?.message || "Failed to create user account");
    }

    const userId = authData.user.id;

    // Create admin_users entry
    const { error: adminError } = await supabase.from("admin_users").insert({
      id: userId,
      email: invitation.email,
      display_name: displayName,
      role: invitation.role,
    });

    if (adminError) {
      console.error("Admin users error:", adminError);
      // Rollback auth user
      await supabase.auth.admin.deleteUser(userId);
      throw new Error("Failed to create admin profile");
    }

    // Create user_roles entry
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: invitation.role,
    });

    if (roleError) {
      console.error("Role error:", roleError);
    }

    // Delete the invitation
    await supabase.from("pending_invitations").delete().eq("id", invitation.id);

    // Log the activity
    await supabase.from("activity_logs").insert({
      user_id: userId,
      user_email: invitation.email,
      action: "invite_accepted",
      resource_type: "user",
      resource_name: displayName,
      details: { role: invitation.role, invited_by: invitation.invited_by_email },
    });

    console.log(`User ${invitation.email} accepted invitation and created account`);

    return new Response(
      JSON.stringify({ success: true, email: invitation.email }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in accept-admin-invite:", error);
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
