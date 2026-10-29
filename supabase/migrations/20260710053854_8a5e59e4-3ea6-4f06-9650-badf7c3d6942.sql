DROP INDEX IF EXISTS public.meta_leads_ghl_contact_id_key;
ALTER TABLE public.meta_leads
  ADD CONSTRAINT meta_leads_ghl_contact_id_key UNIQUE (ghl_contact_id);