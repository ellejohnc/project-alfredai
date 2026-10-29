-- Drop the permissive policies completely
DROP POLICY IF EXISTS "Sessions viewable with matching token" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Sessions updatable with matching token" ON public.visitor_sessions;

-- Create secure policies that only work via service role (Edge Functions)
-- Public users cannot directly SELECT or UPDATE - they must go through Edge Functions
CREATE POLICY "Only service role can view sessions"
ON public.visitor_sessions
FOR SELECT
TO authenticated, anon
USING (false);  -- Block direct access from frontend

CREATE POLICY "Only service role can update sessions"
ON public.visitor_sessions
FOR UPDATE
TO authenticated, anon
USING (false);  -- Block direct access from frontend

-- Keep INSERT open for session creation (will be handled by Edge Function too)
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.visitor_sessions;
CREATE POLICY "Only service role can create sessions"
ON public.visitor_sessions
FOR INSERT
TO authenticated, anon
WITH CHECK (false);  -- Block direct access from frontend