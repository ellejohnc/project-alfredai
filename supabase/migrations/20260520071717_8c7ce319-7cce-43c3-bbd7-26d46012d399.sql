CREATE TABLE public.blog_api_alert_config (
  id integer PRIMARY KEY DEFAULT 1,
  recipient text NOT NULL DEFAULT 'elle.c@alfredai.bot',
  threshold integer NOT NULL DEFAULT 5 CHECK (threshold >= 1),
  window_minutes integer NOT NULL DEFAULT 10 CHECK (window_minutes >= 1),
  cooldown_minutes integer NOT NULL DEFAULT 60 CHECK (cooldown_minutes >= 0),
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT singleton CHECK (id = 1)
);

ALTER TABLE public.blog_api_alert_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blog api alert config"
  ON public.blog_api_alert_config FOR SELECT
  TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update blog api alert config"
  ON public.blog_api_alert_config FOR UPDATE
  TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can insert blog api alert config"
  ON public.blog_api_alert_config FOR INSERT
  TO authenticated WITH CHECK (is_admin(auth.uid()));

INSERT INTO public.blog_api_alert_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;