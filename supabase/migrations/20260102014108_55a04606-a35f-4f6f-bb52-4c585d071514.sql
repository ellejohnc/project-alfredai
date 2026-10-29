-- Create table to track investor access code usage
CREATE TABLE public.investor_code_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor_id UUID REFERENCES public.investor_leads(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL,
  is_master_code BOOLEAN DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_code_usage ENABLE ROW LEVEL SECURITY;

-- Only admins can view usage logs
CREATE POLICY "Admins can view investor code usage"
ON public.investor_code_usage
FOR SELECT
USING (is_admin(auth.uid()));

-- Block public modifications
CREATE POLICY "Block public insert on investor_code_usage"
ON public.investor_code_usage
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block updates on investor_code_usage"
ON public.investor_code_usage
FOR UPDATE
USING (false);

CREATE POLICY "Block deletes on investor_code_usage"
ON public.investor_code_usage
FOR DELETE
USING (false);

-- Add index for faster lookups
CREATE INDEX idx_investor_code_usage_investor_id ON public.investor_code_usage(investor_id);
CREATE INDEX idx_investor_code_usage_accessed_at ON public.investor_code_usage(accessed_at DESC);