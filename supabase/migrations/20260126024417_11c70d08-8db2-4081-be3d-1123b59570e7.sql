-- Add final investment amount columns to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS setup_fee_final INTEGER,
ADD COLUMN IF NOT EXISTS monthly_retainer_final INTEGER;

-- Add the same columns to quote_versions for history tracking
ALTER TABLE public.quote_versions 
ADD COLUMN IF NOT EXISTS setup_fee_final NUMERIC,
ADD COLUMN IF NOT EXISTS monthly_retainer_final NUMERIC;

-- Add comment explaining the columns
COMMENT ON COLUMN public.quotes.setup_fee_final IS 'Definitive setup fee amount (not a range) - set by sales rep before generating proposal';
COMMENT ON COLUMN public.quotes.monthly_retainer_final IS 'Definitive monthly retainer amount (not a range) - set by sales rep before generating proposal';