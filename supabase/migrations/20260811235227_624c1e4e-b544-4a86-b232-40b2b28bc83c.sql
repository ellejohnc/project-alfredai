ALTER TABLE public.quote_payments DROP CONSTRAINT quote_payments_installment_type_check;
ALTER TABLE public.quote_payments ADD CONSTRAINT quote_payments_installment_type_check
  CHECK (installment_type IS NULL OR installment_type = ANY (ARRAY['full','initiation','month1','month2','month3','second','balance']));