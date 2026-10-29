CREATE OR REPLACE FUNCTION public.confirm_quote_payment(p_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows integer;
BEGIN
  UPDATE public.quote_payments
  SET client_confirmed_at = COALESCE(client_confirmed_at, now())
  WHERE id = p_payment_id;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_quote_payment(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.confirm_quote_payment(uuid) TO anon, authenticated;