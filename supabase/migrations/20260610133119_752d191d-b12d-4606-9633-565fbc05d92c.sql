CREATE TABLE public.webinar_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webinar_slug text NOT NULL DEFAULT 'agenticbusiness',
  first_name text NOT NULL,
  last_name text,
  email text NOT NULL,
  phone text,
  company text,
  role text,
  industry text,
  business_size text,
  ai_interest text,
  repetitive_workflow text,
  consent boolean NOT NULL DEFAULT false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  reminder_sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT INSERT ON public.webinar_registrations TO anon, authenticated;
GRANT SELECT ON public.webinar_registrations TO authenticated;
GRANT ALL ON public.webinar_registrations TO service_role;

ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register for a webinar"
ON public.webinar_registrations
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view webinar registrations"
ON public.webinar_registrations
FOR SELECT
TO authenticated
USING (public.can_view_registrations(auth.uid()));