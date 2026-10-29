-- Create email_template_versions table for version history
CREATE TABLE public.email_template_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  heading TEXT NOT NULL,
  body_text TEXT NOT NULL,
  button_text TEXT,
  footer_text TEXT,
  custom_html TEXT,
  use_custom_html BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX idx_template_versions_template_id ON public.email_template_versions(template_id);
CREATE INDEX idx_template_versions_key_version ON public.email_template_versions(template_key, version_number DESC);

-- Enable RLS
ALTER TABLE public.email_template_versions ENABLE ROW LEVEL SECURITY;

-- Only admins can view versions
CREATE POLICY "Admins can view template versions"
ON public.email_template_versions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Only admins can insert versions (for manual saves)
CREATE POLICY "Admins can insert template versions"
ON public.email_template_versions
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Function to auto-save version on template update
CREATE OR REPLACE FUNCTION public.save_email_template_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get the next version number for this template
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.email_template_versions
  WHERE template_id = OLD.id;

  -- Insert the previous version into history
  INSERT INTO public.email_template_versions (
    template_id,
    template_key,
    version_number,
    subject,
    heading,
    body_text,
    button_text,
    footer_text,
    custom_html,
    use_custom_html,
    created_by
  ) VALUES (
    OLD.id,
    OLD.template_key,
    next_version,
    OLD.subject,
    OLD.heading,
    OLD.body_text,
    OLD.button_text,
    OLD.footer_text,
    OLD.custom_html,
    OLD.use_custom_html,
    OLD.updated_by
  );

  RETURN NEW;
END;
$$;

-- Create trigger to auto-save versions before update
CREATE TRIGGER save_template_version_before_update
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.save_email_template_version();

-- Insert initial versions for existing templates (version 1)
INSERT INTO public.email_template_versions (template_id, template_key, version_number, subject, heading, body_text, button_text, footer_text, custom_html, use_custom_html)
SELECT id, template_key, 1, subject, heading, body_text, button_text, footer_text, custom_html, use_custom_html
FROM public.email_templates;