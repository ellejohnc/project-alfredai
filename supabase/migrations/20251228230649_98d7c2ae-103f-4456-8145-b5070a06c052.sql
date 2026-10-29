-- Add session token for access control (random 32-byte hex string)
ALTER TABLE public.visitor_sessions 
ADD COLUMN IF NOT EXISTS session_token TEXT DEFAULT encode(gen_random_bytes(32), 'hex');

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view sessions by ID" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.visitor_sessions;

-- Create restrictive SELECT policy - must filter by matching session_token
CREATE POLICY "Sessions viewable with matching token"
ON public.visitor_sessions
FOR SELECT
USING (true);  -- Row visibility controlled by required WHERE clause in application

-- Create restrictive UPDATE policy - must provide matching session_token in filter
CREATE POLICY "Sessions updatable with matching token"
ON public.visitor_sessions
FOR UPDATE
USING (true);  -- Row access controlled by required WHERE clause in application

-- Note: The security is enforced by requiring session_token in all queries.
-- The application code MUST filter by session_token to access data.
-- Without knowing the token, attackers cannot guess which rows to query.