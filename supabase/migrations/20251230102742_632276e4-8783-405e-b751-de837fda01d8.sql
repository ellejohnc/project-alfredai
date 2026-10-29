-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Only service role can view registrations" ON public.event_registrations;

-- Create new policy allowing admins to view registrations
CREATE POLICY "Admins can view registrations"
ON public.event_registrations
FOR SELECT
USING (is_admin(auth.uid()));

-- Drop the existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Only service role can update registrations" ON public.event_registrations;

-- Create new policy allowing admins to update registrations
CREATE POLICY "Admins can update registrations"
ON public.event_registrations
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete registrations
CREATE POLICY "Admins can delete registrations"
ON public.event_registrations
FOR DELETE
USING (is_admin(auth.uid()));