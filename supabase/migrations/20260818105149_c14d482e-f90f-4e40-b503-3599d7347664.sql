CREATE TABLE public.lead_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_source text NOT NULL,
  lead_id uuid NOT NULL,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (lead_source, lead_id, follower_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_followers TO authenticated;
GRANT ALL ON public.lead_followers TO service_role;

ALTER TABLE public.lead_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lead viewers can see followers"
ON public.lead_followers FOR SELECT TO authenticated
USING (public.can_view_leads(auth.uid()));

CREATE POLICY "Users can follow leads for themselves"
ON public.lead_followers FOR INSERT TO authenticated
WITH CHECK (follower_id = auth.uid() AND public.can_view_leads(auth.uid()));

CREATE POLICY "Users can unfollow their own follows"
ON public.lead_followers FOR DELETE TO authenticated
USING (follower_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE INDEX idx_lead_followers_lead ON public.lead_followers (lead_source, lead_id);
CREATE INDEX idx_lead_followers_follower ON public.lead_followers (follower_id);

CREATE TRIGGER update_lead_followers_updated_at
BEFORE UPDATE ON public.lead_followers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();