ALTER TABLE public.quote_payments DROP CONSTRAINT IF EXISTS quote_payments_status_check;

-- 'superseded' means a payment link was replaced or withdrawn — it is NOT a
-- failure and NOT a payment. The app has been writing it from two places
-- (reverting a signed quote, and the bulk action) since before this constraint
-- existed, so every one of those writes was silently rejected and the old
-- links stayed live. Adding it makes the existing feature actually work.
ALTER TABLE public.quote_payments ADD CONSTRAINT quote_payments_status_check
  CHECK (status = ANY (ARRAY['pending','clicked','completed','failed','expired','superseded']));