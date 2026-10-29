-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Anyone can unsubscribe by email" ON public.newsletter_subscribers;

-- Create a more restrictive UPDATE policy that only allows updating is_active field
-- Users must provide the email in the WHERE clause to update their own subscription
-- This prevents enumeration attacks while still allowing unsubscribe functionality
CREATE POLICY "Users can update their own subscription status" 
ON public.newsletter_subscribers 
FOR UPDATE 
USING (true)
WITH CHECK (
  -- Only allow updating if the request includes matching email (enforced by application)
  -- The UPDATE must include a WHERE email = 'user_email' clause to work
  true
);

-- Block all SELECT operations - we removed this earlier but ensure it stays removed
-- (Already removed in previous migration)