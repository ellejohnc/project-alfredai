-- Add feature flag for Press page Coming Soon overlay
INSERT INTO public.feature_flags (flag_key, is_enabled, description) VALUES
  ('press_coming_soon', true, 'Show Coming Soon overlay on Press page')
ON CONFLICT (flag_key) DO NOTHING;