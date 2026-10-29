import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminUserRequest {
  email: string;
  password: string;
  displayName: string;
  role: 'super_admin' | 'admin' | 'editor' | 'sales_rep';
  forcePasswordChange?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token to verify permissions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Client with user's auth to check permissions
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !currentUser) {
      console.error('Failed to get current user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Request from user:', currentUser.email);

    // Check if the current user has permission to create admin users
    const { data: currentUserRole, error: roleError } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (roleError) {
      console.error('Failed to check user role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerRole = currentUserRole?.role;
    const canCreateUsers = callerRole === 'super_admin' || callerRole === 'admin';

    if (!canCreateUsers) {
      console.error('User does not have permission to create admin users:', callerRole);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateAdminUserRequest = await req.json();
    const { email, password, displayName, role, forcePasswordChange } = body;

    console.log('Creating admin user:', { email, displayName, role });

    // Validate input
    if (!email || !password || !displayName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, displayName, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role permissions - admins can only create editors and sales_reps
    if (callerRole === 'admin' && role !== 'editor' && role !== 'sales_rep') {
      console.error('Admin tried to create restricted role:', role);
      return new Response(
        JSON.stringify({ error: 'Admins can only create editor or sales rep users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Check if user already exists in admin_users
    const { data: existingAdminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingAdminUser) {
      console.error('User already exists:', email);
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists. Delete the existing account first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if there's a pending invitation for this email
    const { data: existingInvite } = await supabaseAdmin
      .from('pending_invitations')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingInvite) {
      console.error('Pending invitation exists for:', email);
      return new Response(
        JSON.stringify({ error: 'A pending invitation already exists for this email. Cancel it first or use invite instead.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        force_password_change: forcePasswordChange === true
      }
    });

    if (authError) {
      const isEmailExists = authError.code === 'email_exists' || authError.message?.toLowerCase().includes('already been registered');

      if (isEmailExists) {
        console.log('Email exists in auth but not in admin_users — attempting state repair for:', email);
        // Find the existing auth user by email to repair state desync
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        const existingAuthUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (listError || !existingAuthUser) {
          console.error('Could not find existing auth user:', listError);
          return new Response(
            JSON.stringify({ error: 'A user with this email exists in auth but could not be located. Please contact support.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const existingUserId = existingAuthUser.id;
        console.log('Found existing auth user, repairing admin_users record:', existingUserId);

        // Insert into admin_users (upsert to be safe)
        const { error: repairAdminError } = await supabaseAdmin
          .from('admin_users')
          .upsert({ id: existingUserId, email, display_name: displayName, role }, { onConflict: 'id' });

        if (repairAdminError) {
          console.error('Failed to repair admin_users entry:', repairAdminError);
          return new Response(
            JSON.stringify({ error: 'Failed to repair user record. Please contact support.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Upsert user_roles (conflict on user_id,role composite unique constraint)
        await supabaseAdmin
          .from('user_roles')
          .upsert({ user_id: existingUserId, role }, { onConflict: 'user_id,role' });

        console.log('Successfully repaired user state for:', email);
        return new Response(
          JSON.stringify({ success: true, user: { id: existingUserId, email, display_name: displayName, role }, repaired: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.error('Failed to create auth user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;
    console.log('Created auth user with ID:', newUserId);

    // Insert into admin_users table
    const { error: adminUserError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: newUserId,
        email,
        display_name: displayName,
        role
      });

    if (adminUserError) {
      console.error('Failed to create admin_users entry:', adminUserError);
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into user_roles table
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role
      });

    if (roleInsertError) {
      console.error('Failed to create user_roles entry:', roleInsertError);
      // Rollback: delete admin_users and auth user
      await supabaseAdmin.from('admin_users').delete().eq('id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Failed to assign user role' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully created admin user:', { id: newUserId, email, displayName, role });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { 
          id: newUserId, 
          email, 
          display_name: displayName, 
          role 
        } 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
