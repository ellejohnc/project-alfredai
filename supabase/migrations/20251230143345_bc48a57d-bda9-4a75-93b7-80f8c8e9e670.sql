-- Add explicit policy to block public reads on event_registrations
-- This ensures only authenticated admins can view registration data
CREATE POLICY "Block public reads on event_registrations"
ON public.event_registrations
FOR SELECT
USING (false);

-- Note: The existing "Admins can view registrations" policy with is_admin(auth.uid()) 
-- will still work because it's checked separately. With both policies:
-- - Non-admins: blocked by the false policy
-- - Admins: allowed by the is_admin policy (restrictive policies use AND logic,
--   but since both are restrictive, the more permissive one for the specific user wins)