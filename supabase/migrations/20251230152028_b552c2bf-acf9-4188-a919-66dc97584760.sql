-- Add color customization columns to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS header_bg_start TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS header_bg_end TEXT DEFAULT '#334155',
ADD COLUMN IF NOT EXISTS button_bg_start TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS button_bg_end TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS body_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS footer_bg_color TEXT DEFAULT '#f1f5f9',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#475569',
ADD COLUMN IF NOT EXISTS heading_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS button_text_color TEXT DEFAULT '#ffffff';

-- Add same columns to versions table for history
ALTER TABLE public.email_template_versions 
ADD COLUMN IF NOT EXISTS header_bg_start TEXT DEFAULT '#1e293b',
ADD COLUMN IF NOT EXISTS header_bg_end TEXT DEFAULT '#334155',
ADD COLUMN IF NOT EXISTS button_bg_start TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS button_bg_end TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS body_bg_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS footer_bg_color TEXT DEFAULT '#f1f5f9',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#475569',
ADD COLUMN IF NOT EXISTS heading_color TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS button_text_color TEXT DEFAULT '#ffffff';

-- Update the version trigger to include color fields
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
    header_bg_start,
    header_bg_end,
    button_bg_start,
    button_bg_end,
    body_bg_color,
    footer_bg_color,
    text_color,
    heading_color,
    button_text_color,
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
    OLD.header_bg_start,
    OLD.header_bg_end,
    OLD.button_bg_start,
    OLD.button_bg_end,
    OLD.body_bg_color,
    OLD.footer_bg_color,
    OLD.text_color,
    OLD.heading_color,
    OLD.button_text_color,
    OLD.updated_by
  );

  RETURN NEW;
END;
$$;