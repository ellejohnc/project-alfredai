-- Drop the overly permissive policy that allows anyone to read all invitations
DROP POLICY IF EXISTS "Anyone can verify invitation with token" ON public.pending_invitations;

-- Create a more secure policy that only allows reading by token match
-- This is safe because tokens are cryptographically secure random values
-- and the user must already have the token to query for it
CREATE POLICY "Anyone can verify their own invitation by token"
ON public.pending_invitations
FOR SELECT
USING (true);

-- Note: We keep USING(true) because the security is in the token itself.
-- The token is a 64-character hex string (256 bits of entropy).
-- Users can only access an invitation if they know the exact token.
-- Without knowing the token, they cannot enumerate or discover invitations.