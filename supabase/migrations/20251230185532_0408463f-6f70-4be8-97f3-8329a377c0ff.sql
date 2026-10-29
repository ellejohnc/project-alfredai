-- Add explicit deny policy for public SELECT on event_registrations
-- This ensures anonymous users cannot read event attendee data
CREATE POLICY "Block public reads on event_registrations" 
ON public.event_registrations 
FOR SELECT 
TO anon
USING (false);