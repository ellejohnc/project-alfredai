CREATE OR REPLACE FUNCTION public.quotes_stamp_signed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('won','signed','refunded') AND (OLD.status IS DISTINCT FROM NEW.status) AND NEW.signed_at IS NULL THEN
    NEW.signed_at := now();
  END IF;
  IF NEW.status NOT IN ('won','signed','refunded') AND OLD.status IN ('won','signed','refunded') THEN
    NEW.signed_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;