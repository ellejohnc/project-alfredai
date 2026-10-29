import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return createRedirectResponse('/admin?google_error=denied');
    }

    if (!code || !stateParam) {
      return createRedirectResponse('/admin?google_error=missing_params');
    }

    // Decode state
    let state: { token: string; returnUrl: string; appOrigin?: string | null };
    try {
      state = JSON.parse(atob(stateParam));
    } catch {
      return createRedirectResponse('/admin?google_error=invalid_state');
    }

    const appOrigin =
      typeof state.appOrigin === 'string' && /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(state.appOrigin)
        ? state.appOrigin
        : null;

    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')!;
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const callbackUrl = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Token exchange failed:', errBody);
      return createRedirectResponse('/admin?google_error=token_exchange', appOrigin);
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return createRedirectResponse('/admin?google_error=userinfo', appOrigin);
    }

    const googleUser = await userInfoRes.json();

    // Verify the Supabase user from the state token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(state.token);
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError);
      return createRedirectResponse('/admin?google_error=auth_failed', appOrigin);
    }

    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ];

    // Build the upsert data — only include refresh_token if Google returned one
    // Google only returns refresh_token on first consent or when prompt=consent is used.
    // If missing, we must preserve the existing one to prevent disconnection.
    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      google_email: googleUser.email,
      google_name: googleUser.name || null,
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      scopes,
      updated_at: new Date().toISOString(),
    };

    if (tokens.refresh_token) {
      // New refresh token provided — save it
      upsertData.refresh_token = tokens.refresh_token;
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('user_google_connections')
      .select('id, refresh_token')
      .eq('user_id', user.id)
      .maybeSingle();

    let saveError;
    if (existing) {
      // Update existing — preserve refresh_token if not provided by Google
      if (!tokens.refresh_token) {
        // Keep the existing refresh_token
        delete upsertData.refresh_token;
      }
      const { error: updateErr } = await supabase
        .from('user_google_connections')
        .update(upsertData)
        .eq('user_id', user.id);
      saveError = updateErr;
    } else {
      // First connection — refresh_token is required
      if (!tokens.refresh_token) {
        console.error('No refresh_token on first connection — Google may not have provided one');
        return createRedirectResponse('/admin?google_error=no_refresh_token', appOrigin);
      }
      upsertData.refresh_token = tokens.refresh_token;
      upsertData.connected_at = new Date().toISOString();
      const { error: insertErr } = await supabase
        .from('user_google_connections')
        .insert(upsertData);
      saveError = insertErr;
    }

    if (saveError) {
      console.error('Failed to save connection:', saveError);
      return createRedirectResponse('/admin?google_error=save_failed', appOrigin);
    }

    const returnUrl = state.returnUrl || '/admin';
    return createRedirectResponse(`${returnUrl}?google_connected=true`, appOrigin);
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return createRedirectResponse('/admin?google_error=unknown');
  }
});

function createRedirectResponse(path: string, appOrigin?: string | null): Response {
  const safePath = path.replace(/[<>"]|javascript:/gi, '');

  if (appOrigin) {
    const destination = new URL(safePath, appOrigin).toString();
    return new Response(null, {
      status: 303,
      headers: {
        Location: destination,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  return new Response('Google OAuth completed, but we could not redirect automatically. Please return to the app and reconnect if needed.', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
