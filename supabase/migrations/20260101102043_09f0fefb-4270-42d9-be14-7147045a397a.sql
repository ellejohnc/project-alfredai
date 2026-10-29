-- Create a table for investor email verification codes
CREATE TABLE public.investor_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification requests (edge function will handle this via service role)
CREATE POLICY "Service role can manage verification codes"
ON public.investor_verification_codes
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX idx_investor_verification_email_code ON public.investor_verification_codes(email, code);

-- Auto-delete expired codes after 1 hour
CREATE INDEX idx_investor_verification_expires ON public.investor_verification_codes(expires_at);