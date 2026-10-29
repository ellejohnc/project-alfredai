
-- 1. Fix generate_tracking_token function search_path
CREATE OR REPLACE FUNCTION public.generate_tracking_token()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$function$;

-- 2. Remove public token lookup from email_tracking_tokens (keep admin-only)
DROP POLICY IF EXISTS "Allow public token lookup" ON public.email_tracking_tokens;

-- 3. Remove public SELECT from quote_payments (data now served via edge function)
DROP POLICY IF EXISTS "Allow public select for quote_payments" ON public.quote_payments;
-- Ensure only admins can read quote_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'quote_payments' AND policyname = 'Admins can manage quote payments'
  ) THEN
    CREATE POLICY "Admins can manage quote payments"
    ON public.quote_payments
    FOR ALL
    USING (is_admin(auth.uid()))
    WITH CHECK (is_admin(auth.uid()));
  END IF;
END $$;

-- Also ensure quote_payments has RLS enabled
ALTER TABLE public.quote_payments ENABLE ROW LEVEL SECURITY;
