CREATE TABLE public.lead_merges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  primary_source text NOT NULL,
  primary_id text NOT NULL,
  merged_source text NOT NULL,
  merged_id text NOT NULL,
  matched_on text NOT NULL DEFAULT 'manual',
  reason text,
  merged_by uuid REFERENCES auth.users,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (merged_source, merged_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_merges TO authenticated;
GRANT ALL ON public.lead_merges TO service_role;

ALTER TABLE public.lead_merges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead viewers can view merges"
  ON public.lead_merges FOR SELECT
  TO authenticated
  USING (public.can_view_leads(auth.uid()));

CREATE POLICY "Lead viewers can create merges"
  ON public.lead_merges FOR INSERT
  TO authenticated
  WITH CHECK (public.can_view_leads(auth.uid()));

CREATE POLICY "Lead viewers can remove merges"
  ON public.lead_merges FOR DELETE
  TO authenticated
  USING (public.can_view_leads(auth.uid()));

CREATE INDEX idx_lead_merges_primary ON public.lead_merges (primary_source, primary_id);