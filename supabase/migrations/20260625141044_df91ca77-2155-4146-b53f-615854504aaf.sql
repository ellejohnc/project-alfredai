
-- Allow backend (service role / no auth context) and admins to set commission fields.
CREATE OR REPLACE FUNCTION public.deals_protect_commission_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- auth.uid() IS NULL means a backend/service-role call (e.g. the Stripe webhook),
  -- which is trusted. Admins are trusted too.
  IF auth.uid() IS NULL OR public.is_partner_admin(auth.uid()) OR public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.stripe_payment_intent_id := NULL;
    NEW.payment_status := 'pending';
    NEW.payment_cleared := false;
    NEW.payment_cleared_at := NULL;
    NEW.commission_status := 'pending';
    NEW.commission_eligible_at := NULL;
    NEW.manual_override := false;
    NEW.override_by := NULL;
    NEW.override_note := NULL;
  ELSE
    NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
    NEW.payment_status := OLD.payment_status;
    NEW.payment_cleared := OLD.payment_cleared;
    NEW.payment_cleared_at := OLD.payment_cleared_at;
    NEW.commission_status := OLD.commission_status;
    NEW.commission_eligible_at := OLD.commission_eligible_at;
    NEW.manual_override := OLD.manual_override;
    NEW.override_by := OLD.override_by;
    NEW.override_note := OLD.override_note;
  END IF;
  RETURN NEW;
END;
$$;

-- Reorder triggers: protection must run BEFORE eligibility is derived.
-- BEFORE-row triggers fire in alphabetical order, so rename accordingly.
DROP TRIGGER IF EXISTS deals_protect_commission_fields ON public.deals;
DROP TRIGGER IF EXISTS deals_commission_eligibility ON public.deals;

CREATE TRIGGER deals_a_protect_commission_fields
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_protect_commission_fields();

CREATE TRIGGER deals_b_commission_eligibility
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_set_commission_eligibility();
