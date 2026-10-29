-- Fix pending_invitations security: Replace overly permissive SELECT policy
-- The current policy "Anyone can verify their own invitation by token" uses USING(true) 
-- which exposes all pending invitations publicly. We need to remove this.

-- Drop the insecure policy
DROP POLICY IF EXISTS "Anyone can verify their own invitation by token" ON public.pending_invitations;

-- The accept-admin-invite edge function uses service role, so we don't need a public SELECT policy.
-- Admins can already view invitations via the existing "Admins can view pending invitations" policy.

-- Add protection against privilege escalation: prevent admins from creating super_admin roles
-- Drop and recreate the INSERT policy with proper restrictions
DROP POLICY IF EXISTS "Super admins and admins can insert roles" ON public.user_roles;

CREATE POLICY "Super admins can insert any role, admins can only insert editor roles"
ON public.user_roles
FOR INSERT
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR (has_role(auth.uid(), 'admin'::app_role) AND role = 'editor'::app_role)
);

-- Drop and recreate the UPDATE policy to prevent privilege escalation
DROP POLICY IF EXISTS "Super admins and admins can update roles" ON public.user_roles;

CREATE POLICY "Super admins can update any role, admins can only set editor role"
ON public.user_roles
FOR UPDATE
USING (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  is_super_admin(auth.uid()) 
  OR (has_role(auth.uid(), 'admin'::app_role) AND role = 'editor'::app_role)
);