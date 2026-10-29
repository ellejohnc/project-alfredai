import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID');
    if (!clientId) {
      return new Response(JSON.stringify({ error: 'Google OAuth not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract user ID from auth header for state validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body for redirect info
    const { returnUrl, appOrigin } = await req.json().catch(() => ({ returnUrl: null, appOrigin: null }));

    const safeAppOrigin =
      typeof appOrigin === 'string' && /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(appOrigin)
        ? appOrigin
        : null;

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const callbackUrl = `${supabaseUrl}/functions/v1/google-oauth-callback`;

    // Encode state with user token and return URL
    const state = btoa(JSON.stringify({
      token: authHeader.replace('Bearer ', ''),
      returnUrl: returnUrl || '/admin',
      appOrigin: safeAppOrigin,
    }));

    const scopes = [
      'openid',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'select_account consent',
      state,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return new Response(JSON.stringify({ url: authUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return new Response(JSON.stringify({ error: 'Failed to initiate OAuth' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
