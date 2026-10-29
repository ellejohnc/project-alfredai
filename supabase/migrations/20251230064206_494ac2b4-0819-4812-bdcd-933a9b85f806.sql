-- Allow anyone to update their subscription status by email
CREATE POLICY "Anyone can unsubscribe by email" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (true)
WITH CHECK (true);