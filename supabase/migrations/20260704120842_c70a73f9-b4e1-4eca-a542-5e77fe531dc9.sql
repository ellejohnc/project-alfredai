
CREATE TABLE public.lead_annotations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_source text NOT NULL,
  lead_id text NOT NULL,
  owner_id uuid NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  stage text NULL,
  outcome text NULL CHECK (outcome IN ('won','lost')),
  updated_by uuid NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_source, lead_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_annotations TO authenticated;
GRANT ALL ON public.lead_annotations TO service_role;

ALTER TABLE public.lead_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead viewers can view annotations" ON public.lead_annotations
  FOR SELECT USING (public.can_view_leads(auth.uid()));
CREATE POLICY "Lead viewers can create annotations" ON public.lead_annotations
  FOR INSERT WITH CHECK (public.can_view_leads(auth.uid()));
CREATE POLICY "Lead viewers can update annotations" ON public.lead_annotations
  FOR UPDATE USING (public.can_view_leads(auth.uid())) WITH CHECK (public.can_view_leads(auth.uid()));
CREATE POLICY "Lead viewers can delete annotations" ON public.lead_annotations
  FOR DELETE USING (public.can_view_leads(auth.uid()));

CREATE TABLE public.lead_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_source text NOT NULL,
  lead_id text NOT NULL,
  body text NOT NULL,
  author_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_notes_lead ON public.lead_notes (lead_source, lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_notes TO authenticated;
GRANT ALL ON public.lead_notes TO service_role;

ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead viewers can view notes" ON public.lead_notes
  FOR SELECT USING (public.can_view_leads(auth.uid()));
CREATE POLICY "Lead viewers can create notes" ON public.lead_notes
  FOR INSERT WITH CHECK (public.can_view_leads(auth.uid()));
CREATE POLICY "Lead viewers can delete notes" ON public.lead_notes
  FOR DELETE USING (public.can_view_leads(auth.uid()));
