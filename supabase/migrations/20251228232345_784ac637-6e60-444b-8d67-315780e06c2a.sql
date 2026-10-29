-- Block all SELECT access to leads table (only INSERT allowed for form submissions)
-- Leads should only be accessed via Supabase Dashboard or service role

-- Add explicit deny policy for SELECT
CREATE POLICY "Block public reads on leads"
  ON public.leads
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- Add explicit deny policy for UPDATE
CREATE POLICY "Block updates on leads"
  ON public.leads
  FOR UPDATE
  TO anon, authenticated
  USING (false);

-- Add explicit deny policy for DELETE
CREATE POLICY "Block deletes on leads"
  ON public.leads
  FOR DELETE
  TO anon, authenticated
  USING (false);

COMMENT ON POLICY "Block public reads on leads" ON public.leads IS 
  'Prevents public enumeration of lead data. Access via Supabase Dashboard or service role only.';