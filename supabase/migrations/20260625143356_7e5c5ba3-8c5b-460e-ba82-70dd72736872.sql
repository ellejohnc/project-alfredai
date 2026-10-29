CREATE TABLE public.partner_payout_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name text,
  bank_name text,
  bsb text,
  account_number text,
  payout_email text,
  payout_method text NOT NULL DEFAULT 'bank_transfer',
  country text NOT NULL DEFAULT 'Australia',
  abn text,
  gst_registered boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_payout_details TO authenticated;
GRANT ALL ON public.partner_payout_details TO service_role;

ALTER TABLE public.partner_payout_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners manage own payout details"
ON public.partner_payout_details
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR public.is_partner_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id OR public.is_partner_admin(auth.uid()));

CREATE TRIGGER update_partner_payout_details_updated_at
BEFORE UPDATE ON public.partner_payout_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();