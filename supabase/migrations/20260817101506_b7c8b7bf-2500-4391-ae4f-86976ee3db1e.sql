ALTER TABLE public.lead_annotations
  ADD COLUMN IF NOT EXISTS owner_source text;

ALTER TABLE public.lead_annotations
  DROP CONSTRAINT IF EXISTS lead_annotations_owner_source_check;
ALTER TABLE public.lead_annotations
  ADD CONSTRAINT lead_annotations_owner_source_check
  CHECK (owner_source IS NULL OR owner_source = ANY (ARRAY['ghl','manual']));

UPDATE public.lead_annotations
SET owner_source = 'ghl'
WHERE owner_id IS NOT NULL AND owner_source IS NULL;