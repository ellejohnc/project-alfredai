CREATE OR REPLACE FUNCTION public.quotes_stamp_signed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('won','signed') AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.signed_at IS NULL THEN
    NEW.signed_at := now();
  END IF;
  IF NEW.status NOT IN ('won','signed') AND OLD.status IN ('won','signed') THEN
    NEW.signed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_stamp_signed_at_trg ON public.quotes;
CREATE TRIGGER quotes_stamp_signed_at_trg
BEFORE UPDATE ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.quotes_stamp_signed_at();