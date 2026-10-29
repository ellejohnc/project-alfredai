-- Create enum for investor lead status
CREATE TYPE public.investor_lead_status AS ENUM ('pending_review', 'approved', 'rejected');

-- Add new columns to investor_leads table
ALTER TABLE public.investor_leads 
  ADD COLUMN status public.investor_lead_status NOT NULL DEFAULT 'pending_review',
  ADD COLUMN access_code text UNIQUE,
  ADD COLUMN access_code_expires_at timestamp with time zone,
  ADD COLUMN reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN reviewed_at timestamp with time zone,
  ADD COLUMN admin_notes text;

-- Create index on access_code for fast lookups
CREATE INDEX idx_investor_leads_access_code ON public.investor_leads(access_code) WHERE access_code IS NOT NULL;

-- Create index on status for filtering
CREATE INDEX idx_investor_leads_status ON public.investor_leads(status);

-- Add RLS policy to allow admins to update investor leads
CREATE POLICY "Admins can update investor leads"
ON public.investor_leads
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add RLS policy to allow admins to delete investor leads
CREATE POLICY "Admins can delete investor leads"
ON public.investor_leads
FOR DELETE
USING (is_admin(auth.uid()));