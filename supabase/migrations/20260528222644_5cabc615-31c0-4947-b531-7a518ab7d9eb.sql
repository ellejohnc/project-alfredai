-- ============================================================
-- Security hardening migration
-- ============================================================

-- 1. proposal_signatures: remove public INSERT.
--    Signatures are created exclusively by the `sign-proposal` edge function
--    (service role), which validates the per-quote access code first.
DROP POLICY IF EXISTS "Allow public insert for signatures" ON public.proposal_signatures;

-- 2. short_links: restrict public SELECT to demo-share links only.
--    Redirects use the SECURITY DEFINER `increment_short_link_click` RPC,
--    and admins retain full access via the "Admins can manage short links" policy.
DROP POLICY IF EXISTS "Public can read short links" ON public.short_links;
CREATE POLICY "Public can read demo share short links"
ON public.short_links
FOR SELECT
USING (content_type = 'demo_share');

-- 3. faq_engagement & page_engagement: sanitise anon-supplied visitor_email.
--    Reject/clear values that are not well-formed email addresses so anonymous
--    users cannot pollute analytics with arbitrary strings.
CREATE OR REPLACE FUNCTION public.sanitize_visitor_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.visitor_email IS NOT NULL THEN
    NEW.visitor_email := lower(trim(NEW.visitor_email));
    IF NEW.visitor_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(NEW.visitor_email) > 254 THEN
      NEW.visitor_email := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_visitor_email_faq ON public.faq_engagement;
CREATE TRIGGER sanitize_visitor_email_faq
BEFORE INSERT OR UPDATE ON public.faq_engagement
FOR EACH ROW EXECUTE FUNCTION public.sanitize_visitor_email();

DROP TRIGGER IF EXISTS sanitize_visitor_email_page ON public.page_engagement;
CREATE TRIGGER sanitize_visitor_email_page
BEFORE INSERT OR UPDATE ON public.page_engagement
FOR EACH ROW EXECUTE FUNCTION public.sanitize_visitor_email();

-- 4. email_logs: enforce that ip_address is always a hashed value.
--    Project policy stores a 16-char SHA-256 hex prefix. Any value that is not
--    a 16-char hex string (e.g. a raw IPv4/IPv6 address) is cleared.
CREATE OR REPLACE FUNCTION public.enforce_email_logs_ip_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ip_address IS NOT NULL AND NEW.ip_address !~ '^[0-9a-f]{16}$' THEN
    NEW.ip_address := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_logs_ip_hash_trg ON public.email_logs;
CREATE TRIGGER enforce_email_logs_ip_hash_trg
BEFORE INSERT OR UPDATE ON public.email_logs
FOR EACH ROW EXECUTE FUNCTION public.enforce_email_logs_ip_hash();

-- 5. quotes: harden public INSERT.
--    The DIY quote builder lets passcode-gated (non-admin) users save draft
--    quotes via a public INSERT. Prevent those anonymous inserts from forging
--    sensitive state (pre-signed/approved status, chosen access codes, handover
--    state). Admin inserts (service role / authenticated admins) are untouched.
CREATE OR REPLACE FUNCTION public.harden_public_quote_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only constrain inserts that are NOT performed by an admin user.
  IF NOT public.is_admin(auth.uid()) THEN
    NEW.status := 'draft';
    NEW.outcome := NULL;
    NEW.signed_at := NULL;
    NEW.signed_by_name := NULL;
    NEW.signed_by_email := NULL;
    NEW.signature_ip_hash := NULL;
    NEW.handover_status := NULL;
    NEW.handover_triggered_at := NULL;
    NEW.handover_notes := NULL;
    -- Always server-generate the access code; never trust client-supplied value.
    NEW.access_code := public.generate_quote_access_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS harden_public_quote_insert_trg ON public.quotes;
CREATE TRIGGER harden_public_quote_insert_trg
BEFORE INSERT ON public.quotes
FOR EACH ROW EXECUTE FUNCTION public.harden_public_quote_insert();