-- 1. Quotes: remove the public INSERT policy. All legitimate quote creation
-- happens through admin policies or edge functions (service role), so anonymous
-- inserts of spoofed/sensitive quote rows are no longer possible.
DROP POLICY IF EXISTS "Allow public insert for quotes" ON public.quotes;

-- 2. Partner chat: inserts only happen via the partner-chat edge function
-- (service role, which bypasses RLS). Remove the permissive public INSERT
-- policies so arbitrary clients can no longer inject messages/sessions.
DROP POLICY IF EXISTS "Anyone can insert partner chat messages" ON public.partner_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert partner chat sessions" ON public.partner_chat_sessions;

-- 3. user_google_connections: prevent OAuth tokens from being readable by
-- client roles. Row-level access for own metadata stays intact, but the token
-- columns are revoked at the column level. Edge functions use the service role
-- (which bypasses these grants) to read tokens when needed.
REVOKE SELECT (access_token, refresh_token) ON public.user_google_connections FROM authenticated;
REVOKE SELECT (access_token, refresh_token) ON public.user_google_connections FROM anon;