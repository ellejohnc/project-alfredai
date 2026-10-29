
-- Add client_confirmed_at column to quote_payments
ALTER TABLE public.quote_payments
ADD COLUMN client_confirmed_at timestamptz DEFAULT NULL;

-- Allow public updates (scoped in app code to only client_confirmed_at)
CREATE POLICY "Allow public confirmation update"
ON public.quote_payments FOR UPDATE
USING (true)
WITH CHECK (true);
