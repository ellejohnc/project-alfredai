DROP POLICY IF EXISTS "Distributors can view payments of accessible quotes" ON public.quote_payments;

-- quote_payments.quote_id is TEXT and holds the quote's BUSINESS key
-- (quotes.quote_id, e.g. 'BUX-8WNP-TULRR'), never the uuid. Joining on
-- (q.id)::text matched only legacy rows written before that convention
-- settled, so distributors saw none of their real payments.
CREATE POLICY "Distributors can view payments of accessible quotes"
  ON public.quote_payments
  FOR SELECT
  USING (
    is_distributor(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.quotes q
      WHERE q.quote_id = quote_payments.quote_id
        AND distributor_can_access(q.assigned_distributor_id, q.created_by_user_id, 'quote', q.id)
    )
  );