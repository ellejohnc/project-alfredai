CREATE TABLE public.admin_theme_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  theme_preset text NOT NULL DEFAULT 'system',
  accent_color text DEFAULT NULL,
  contrast numeric DEFAULT 1.0,
  saturation numeric DEFAULT 1.0,
  sidebar_style text DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_theme_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own theme preferences"
  ON public.admin_theme_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own theme preferences"
  ON public.admin_theme_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own theme preferences"
  ON public.admin_theme_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_theme_preferences_updated_at
  BEFORE UPDATE ON public.admin_theme_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();