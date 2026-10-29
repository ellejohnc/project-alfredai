-- Fix blog_views RLS to only allow admin reads (aggregate counts handled by database function)
-- Drop existing permissive policy
DROP POLICY IF EXISTS "Public can read blog views for counting" ON public.blog_views;

-- Create restrictive policy - only admins can read individual blog view records
CREATE POLICY "Admins can read blog view records" 
ON public.blog_views 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- The get_blog_view_counts() function already exists and returns aggregates
-- It's marked as STABLE which means anyone can call it, but it only returns counts, not individual records