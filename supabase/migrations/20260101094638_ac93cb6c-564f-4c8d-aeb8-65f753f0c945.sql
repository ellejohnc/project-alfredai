-- Create a table for qualified investor leads
CREATE TABLE public.investor_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  firm_name TEXT NOT NULL,
  role TEXT NOT NULL,
  investment_focus TEXT,
  typical_check_size TEXT,
  how_heard_about TEXT,
  interest_reason TEXT,
  linkedin_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  session_token TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_leads ENABLE ROW LEVEL SECURITY;

-- Allow public insert for lead capture (no auth required)
CREATE POLICY "Anyone can submit investor qualification"
ON public.investor_leads
FOR INSERT
WITH CHECK (true);

-- Only admins can read investor leads
CREATE POLICY "Admins can view investor leads"
ON public.investor_leads
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Create index for email lookups
CREATE INDEX idx_investor_leads_email ON public.investor_leads(email);

-- Create index for session token lookups
CREATE INDEX idx_investor_leads_session ON public.investor_leads(session_token);