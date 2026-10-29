-- Allow unauthenticated users to look up their invitation by token
-- This is needed for the accept-invite page which is accessed by non-authenticated users
CREATE POLICY "Public can view invitation by token"
ON public.pending_invitations
FOR SELECT
USING (true);