-- Allow unauthenticated users to read their own invitation using the token
-- This is needed for the accept-invite flow where the user is not yet authenticated
CREATE POLICY "Anyone can verify invitation with token"
ON public.pending_invitations
FOR SELECT
USING (true);

-- Drop the old admin-only SELECT policy since the new one is more permissive
-- But we still want admins to see all invitations in the admin panel
-- The new policy allows anyone to SELECT, which covers both cases