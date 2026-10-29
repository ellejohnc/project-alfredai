-- Add access_code column for proposal page protection
ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Add index for fast lookups on quote_id
CREATE INDEX IF NOT EXISTS idx_quotes_quote_id ON public.quotes(quote_id);

-- Add index for access_code lookups
CREATE INDEX IF NOT EXISTS idx_quotes_access_code ON public.quotes(access_code);

-- Function to generate 6-digit access code
CREATE OR REPLACE FUNCTION public.generate_quote_access_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Trigger function to auto-set access code on insert
CREATE OR REPLACE FUNCTION public.set_quote_access_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.access_code IS NULL THEN
    NEW.access_code := public.generate_quote_access_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger (drop first if exists to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_set_quote_access_code ON public.quotes;

CREATE TRIGGER trigger_set_quote_access_code
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_quote_access_code();

-- Backfill existing quotes that don't have access codes
UPDATE public.quotes
SET access_code = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE access_code IS NULL;