CREATE TABLE public.lead_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_segments TO authenticated;
GRANT ALL ON public.lead_segments TO service_role;

ALTER TABLE public.lead_segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage their own lead segments"
ON public.lead_segments
FOR ALL
TO authenticated
USING (auth.uid() = user_id AND public.can_view_leads(auth.uid()))
WITH CHECK (auth.uid() = user_id AND public.can_view_leads(auth.uid()));

CREATE TRIGGER update_lead_segments_updated_at
BEFORE UPDATE ON public.lead_segments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();