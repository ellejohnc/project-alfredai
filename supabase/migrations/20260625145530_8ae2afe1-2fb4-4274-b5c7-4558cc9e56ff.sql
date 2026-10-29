CREATE TABLE public.partner_agreement_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_legal_name TEXT NOT NULL,
  partner_abn TEXT,
  partner_address TEXT,
  territory TEXT,
  signatory_name TEXT NOT NULL,
  signatory_title TEXT,
  signature_text TEXT NOT NULL,
  agreement_version TEXT,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_agreement_signatures TO authenticated;
GRANT ALL ON public.partner_agreement_signatures TO service_role;

ALTER TABLE public.partner_agreement_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners manage their own agreement signature"
  ON public.partner_agreement_signatures
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_partner_agreement_signatures_updated_at
  BEFORE UPDATE ON public.partner_agreement_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();