ALTER TABLE public.quotes ADD COLUMN contract_months integer DEFAULT 24;
ALTER TABLE public.quote_versions ADD COLUMN contract_months integer DEFAULT 24;