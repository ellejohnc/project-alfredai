-- Fix: Drop the incorrect policy and restructure properly
-- The USING(false) restrictive policy would block everyone including admins

-- Drop the incorrect policy we just created
DROP POLICY IF EXISTS "Block public reads on event_registrations" ON public.event_registrations;

-- Drop the existing admin view policy to recreate it as PERMISSIVE
DROP POLICY IF EXISTS "Admins can view registrations" ON public.event_registrations;

-- Create a PERMISSIVE policy for admin SELECT (this is the correct approach)
-- PERMISSIVE policies allow access if ANY permissive policy passes
-- Since this is the only SELECT permissive policy, only admins can read
CREATE POLICY "Admins can view registrations"
ON public.event_registrations
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));