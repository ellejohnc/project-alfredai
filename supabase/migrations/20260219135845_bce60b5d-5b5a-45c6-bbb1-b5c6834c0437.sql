-- Allow public (anon) users to read payment links for proposals
CREATE POLICY "Allow public read for quote payments"
ON public.quote_payments
FOR SELECT
USING (true);