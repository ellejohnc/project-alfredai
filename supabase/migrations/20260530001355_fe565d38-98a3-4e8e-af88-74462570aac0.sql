-- Revoke direct read access to sensitive OAuth token columns from client roles.
-- Edge functions use the service_role key which bypasses these grants.
REVOKE SELECT (access_token, refresh_token) ON public.user_google_connections FROM authenticated;
REVOKE SELECT (access_token, refresh_token) ON public.user_google_connections FROM anon;

-- Ensure remaining (non-sensitive) columns are still readable by the owner via RLS.
GRANT SELECT (id, user_id, google_email, google_name, scopes, connected_at, token_expires_at, updated_at) ON public.user_google_connections TO authenticated;

-- Service role retains full access for edge functions.
GRANT ALL ON public.user_google_connections TO service_role;