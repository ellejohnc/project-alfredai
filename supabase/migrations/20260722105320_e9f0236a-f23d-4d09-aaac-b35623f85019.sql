ALTER TABLE public.demo_engagement DROP CONSTRAINT IF EXISTS demo_engagement_event_type_check;
ALTER TABLE public.demo_engagement ADD CONSTRAINT demo_engagement_event_type_check
  CHECK (event_type IN ('viewed','started','step_completed','completed','abandoned','return_access','meta_ads_bypass'));