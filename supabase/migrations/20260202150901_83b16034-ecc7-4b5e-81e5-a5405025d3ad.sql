-- Create platform_updates table for managing product updates shown on auth page
CREATE TABLE public.platform_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'update',
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add constraint for category values
ALTER TABLE public.platform_updates 
ADD CONSTRAINT platform_updates_category_check 
CHECK (category IN ('new_feature', 'update', 'announcement', 'improvement'));

-- Enable Row Level Security
ALTER TABLE public.platform_updates ENABLE ROW LEVEL SECURITY;

-- Public read access for active updates (no auth required for viewing on login page)
CREATE POLICY "Anyone can view active platform updates"
ON public.platform_updates
FOR SELECT
USING (is_active = true AND (published_at IS NULL OR published_at <= now()));

-- Admins can manage all platform updates
CREATE POLICY "Admins can manage platform updates"
ON public.platform_updates
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create index for common query pattern
CREATE INDEX idx_platform_updates_active_order 
ON public.platform_updates (is_active, display_order, published_at DESC)
WHERE is_active = true;

-- Insert some initial sample updates
INSERT INTO public.platform_updates (title, description, category, display_order, published_at) VALUES
('Workflow Automation 2.0', 'Build complex multi-step workflows with our enhanced automation engine.', 'new_feature', 1, now() - interval '2 days'),
('Enhanced Dashboard Analytics', 'Real-time insights and performance metrics at your fingertips.', 'improvement', 2, now() - interval '5 days'),
('Enterprise SSO Integration', 'Seamless single sign-on support for enterprise clients.', 'announcement', 3, now() - interval '1 week');