-- Add signature and handover fields to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signed_by_name TEXT,
ADD COLUMN IF NOT EXISTS signed_by_email TEXT,
ADD COLUMN IF NOT EXISTS signature_ip_hash TEXT,
ADD COLUMN IF NOT EXISTS handover_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS handover_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS handover_notes TEXT,
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_edited_by TEXT;

-- Create proposal_signatures table for audit trail
CREATE TABLE IF NOT EXISTS public.proposal_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  signer_ip_hash TEXT,
  user_agent TEXT,
  signature_data TEXT,
  signature_type TEXT DEFAULT 'typed',
  terms_accepted BOOLEAN NOT NULL DEFAULT true,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  CONSTRAINT signature_type_check CHECK (signature_type IN ('typed', 'drawn'))
);

-- Create handover_requests table for dev team queue
CREATE TABLE IF NOT EXISTS public.handover_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  workflows JSONB,
  setup_fee_min INTEGER,
  setup_fee_max INTEGER,
  monthly_retainer_min INTEGER,
  monthly_retainer_max INTEGER,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  CONSTRAINT status_check CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed'))
);

-- Enable RLS on new tables
ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for proposal_signatures
CREATE POLICY "Admins can manage proposal signatures"
ON public.proposal_signatures
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Allow public insert for signatures"
ON public.proposal_signatures
FOR INSERT
WITH CHECK (true);

-- RLS policies for handover_requests
CREATE POLICY "Admins can manage handover requests"
ON public.handover_requests
FOR ALL
USING (is_admin(auth.uid()));

-- Create trigger to update handover_requests.updated_at
CREATE TRIGGER update_handover_requests_updated_at
BEFORE UPDATE ON public.handover_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_quote_id ON public.proposal_signatures(quote_id);
CREATE INDEX IF NOT EXISTS idx_handover_requests_quote_id ON public.handover_requests(quote_id);
CREATE INDEX IF NOT EXISTS idx_handover_requests_status ON public.handover_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotes_handover_status ON public.quotes(handover_status);