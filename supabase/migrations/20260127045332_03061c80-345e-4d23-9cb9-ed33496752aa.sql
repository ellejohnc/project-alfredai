-- Add installment tracking columns to quote_payments table
ALTER TABLE public.quote_payments 
ADD COLUMN IF NOT EXISTS installment_type TEXT,
ADD COLUMN IF NOT EXISTS installment_number INTEGER;

-- Add check constraint for valid installment types
ALTER TABLE public.quote_payments 
DROP CONSTRAINT IF EXISTS quote_payments_installment_type_check;

ALTER TABLE public.quote_payments 
ADD CONSTRAINT quote_payments_installment_type_check 
CHECK (installment_type IS NULL OR installment_type IN (
  'full', 'initiation', 'month1', 'month2', 'month3'
));

-- Add comment for documentation
COMMENT ON COLUMN public.quote_payments.installment_type IS 'Type of installment: full (Options B/C), initiation/month1/month2/month3 (Option A)';
COMMENT ON COLUMN public.quote_payments.installment_number IS 'Installment sequence number (1-4 for Option A)';