-- Add a restrictive SELECT policy to block public reads on newsletter_subscribers
-- This prevents anyone from querying subscriber email addresses
CREATE POLICY "Block public reads on newsletter_subscribers" 
ON public.newsletter_subscribers 
FOR SELECT 
USING (false);