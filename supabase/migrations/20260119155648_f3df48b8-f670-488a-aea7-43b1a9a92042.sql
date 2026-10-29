-- Create quote_payments table to track payment link clicks and completions
CREATE TABLE public.quote_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id TEXT NOT NULL, -- The quote ID from generateQuoteId()
  company_name TEXT,
  contact_email TEXT,
  contact_name TEXT,
  
  -- Payment type: slot_reservation, setup_fee, monthly_retainer
  payment_type TEXT NOT NULL CHECK (payment_type IN ('slot_reservation', 'setup_fee', 'monthly_retainer')),
  
  -- Amounts in cents
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  
  -- Stripe references
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  
  -- Status: pending (link generated), clicked (link accessed), completed (payment successful), failed
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'clicked', 'completed', 'failed', 'expired')),
  
  -- Pricing option used (A, B, C)
  pricing_option TEXT CHECK (pricing_option IN ('A', 'B', 'C')),
  
  -- Metadata
  payment_link_url TEXT,
  created_by TEXT, -- Sales rep name
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clicked_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Receipt info
  receipt_url TEXT,
  receipt_number TEXT
);

-- Create index for common queries
CREATE INDEX idx_quote_payments_quote_id ON public.quote_payments(quote_id);
CREATE INDEX idx_quote_payments_status ON public.quote_payments(status);
CREATE INDEX idx_quote_payments_stripe_session ON public.quote_payments(stripe_session_id);
CREATE INDEX idx_quote_payments_contact_email ON public.quote_payments(contact_email);

-- Enable RLS
ALTER TABLE public.quote_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public insert (from edge function webhooks)
CREATE POLICY "Allow public insert for payment tracking" 
ON public.quote_payments 
FOR INSERT 
WITH CHECK (true);

-- Policy: Allow public update (for webhook status updates)
CREATE POLICY "Allow public update for payment status" 
ON public.quote_payments 
FOR UPDATE 
USING (true);

-- Policy: Authenticated users can read all (admin dashboard)
CREATE POLICY "Authenticated users can read payments" 
ON public.quote_payments 
FOR SELECT 
TO authenticated
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.quote_payments IS 'Tracks payment link generation, clicks, and completion for quotes';