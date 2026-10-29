ALTER TABLE public.meta_leads REPLICA IDENTITY FULL;
ALTER TABLE public.investor_leads REPLICA IDENTITY FULL;
ALTER TABLE public.alpha_digital_leads REPLICA IDENTITY FULL;
ALTER TABLE public.webinar_registrations REPLICA IDENTITY FULL;
ALTER TABLE public.demo_engagement REPLICA IDENTITY FULL;
ALTER TABLE public.lead_merges REPLICA IDENTITY FULL;
ALTER TABLE public.lead_annotations REPLICA IDENTITY FULL;
ALTER TABLE public.lead_notes REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investor_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alpha_digital_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.webinar_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.demo_engagement;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_merges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_notes;