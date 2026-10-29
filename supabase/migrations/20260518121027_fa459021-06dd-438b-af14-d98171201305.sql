-- Enum for keyword category
DO $$ BEGIN
  CREATE TYPE public.keyword_category AS ENUM ('branded', 'category', 'competitor', 'long_tail');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tracked keywords table
CREATE TABLE IF NOT EXISTS public.tracked_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category public.keyword_category NOT NULL DEFAULT 'category',
  target_landing_path TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  search_market TEXT NOT NULL DEFAULT 'au',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tracked_keywords_keyword_market_unique UNIQUE (keyword, search_market)
);

CREATE INDEX IF NOT EXISTS idx_tracked_keywords_active ON public.tracked_keywords (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tracked_keywords_category ON public.tracked_keywords (category);

ALTER TABLE public.tracked_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tracked keywords"
  ON public.tracked_keywords FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert tracked keywords"
  ON public.tracked_keywords FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update tracked keywords"
  ON public.tracked_keywords FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete tracked keywords"
  ON public.tracked_keywords FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER trg_tracked_keywords_updated_at
  BEFORE UPDATE ON public.tracked_keywords
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily metric snapshots
CREATE TABLE IF NOT EXISTS public.keyword_metrics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID NOT NULL REFERENCES public.tracked_keywords(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(6,4) NOT NULL DEFAULT 0,
  position NUMERIC(6,2),
  conversions INTEGER NOT NULL DEFAULT 0,
  top_landing_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT keyword_metrics_unique UNIQUE (keyword_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_keyword_metrics_date ON public.keyword_metrics_snapshots (metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_keyword_metrics_keyword ON public.keyword_metrics_snapshots (keyword_id, metric_date DESC);

ALTER TABLE public.keyword_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view keyword metrics"
  ON public.keyword_metrics_snapshots FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert keyword metrics"
  ON public.keyword_metrics_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update keyword metrics"
  ON public.keyword_metrics_snapshots FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete keyword metrics"
  ON public.keyword_metrics_snapshots FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Pre-seed priority keywords from SEO research
INSERT INTO public.tracked_keywords (keyword, category, target_landing_path, notes) VALUES
  ('alfredai', 'branded', '/', 'Primary brand term'),
  ('alfred ai', 'branded', '/', 'Brand term with space'),
  ('alfredai bot', 'branded', '/', 'Branded variant'),
  ('alfred bid', 'branded', '/products', 'Product brand'),
  ('construction estimating software', 'category', '/solutions/construction-estimating-software', 'Primary category keyword'),
  ('building estimating software', 'category', '/solutions/construction-estimating-software', 'Category variant'),
  ('construction software australia', 'category', '/solutions/construction-estimating-software', 'Geo-targeted'),
  ('construction project management software', 'category', '/solutions/construction-project-management-software', 'Pillar page target'),
  ('ai for construction', 'category', '/', 'Awareness term'),
  ('ai construction management', 'category', '/solutions/construction-project-management-software', 'Long tail / AI'),
  ('construction automation', 'category', '/products', 'Category awareness'),
  ('best construction estimating software', 'long_tail', '/solutions/construction-estimating-software', 'Question variant'),
  ('residential construction estimating software', 'long_tail', '/solutions/construction-estimating-software', 'Vertical variant'),
  ('buildxact alternative', 'competitor', '/solutions/construction-estimating-software', 'Competitor capture'),
  ('procore alternative', 'competitor', '/compare/vs-procore', 'Competitor capture')
ON CONFLICT (keyword, search_market) DO NOTHING;