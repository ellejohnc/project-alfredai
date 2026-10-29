-- Ensure updated_at is always populated on quotes
UPDATE public.quotes SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;
UPDATE public.quotes SET created_at = COALESCE(created_at, now()) WHERE created_at IS NULL;

ALTER TABLE public.quotes
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- Replace generic trigger with the canonical updated_at handler
DROP TRIGGER IF EXISTS update_quotes_updated_at ON public.quotes;
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index to support sorting Past Quotes by Last updated
CREATE INDEX IF NOT EXISTS idx_quotes_updated_at ON public.quotes (updated_at DESC);