-- Drop the current UPDATE policy
DROP POLICY IF EXISTS "Users can update their own subscription status" ON public.newsletter_subscribers;

-- Create a restrictive UPDATE policy - only service role can update
-- The frontend will use an edge function to handle unsubscribe requests
CREATE POLICY "Only service role can update subscriptions" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (false)
WITH CHECK (false);