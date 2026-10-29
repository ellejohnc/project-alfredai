-- Remove the overly permissive SELECT policy that exposes all subscriber emails
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.newsletter_subscribers;