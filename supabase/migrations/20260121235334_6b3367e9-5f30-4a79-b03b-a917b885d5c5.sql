-- Create feature_flags table for admin-controlled feature toggles
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Public can read flags (needed for frontend to check status)
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only admins can update flags
CREATE POLICY "Admins can update feature flags"
ON public.feature_flags
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Only super_admins can insert/delete flags
CREATE POLICY "Super admins can insert feature flags"
ON public.feature_flags
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete feature flags"
ON public.feature_flags
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Insert initial flags for Coming Soon overlays
INSERT INTO public.feature_flags (flag_key, is_enabled, description) VALUES
  ('webinars_coming_soon', true, 'Show Coming Soon overlay on Webinars page'),
  ('reviews_coming_soon', true, 'Show Coming Soon overlay on Review Badges section');