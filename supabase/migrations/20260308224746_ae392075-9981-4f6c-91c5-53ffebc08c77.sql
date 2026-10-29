
-- Add a text column for non-UUID content identifiers (e.g., demo IDs like "decision-support")
ALTER TABLE public.short_links ADD COLUMN IF NOT EXISTS source_id text;

-- Allow public inserts for demo share links specifically
CREATE POLICY "Allow public insert for demo share links"
ON public.short_links
FOR INSERT
TO anon, authenticated
WITH CHECK (content_type = 'demo_share');
