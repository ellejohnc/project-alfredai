
-- Commission payout gating: only pay after Stripe reports the client payment cleared,
-- with an admin manual-override path.

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_cleared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_cleared_at timestamptz,
  ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS commission_eligible_at timestamptz,
  ADD COLUMN IF NOT EXISTS manual_override boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS override_by uuid,
  ADD COLUMN IF NOT EXISTS override_note text;

CREATE INDEX IF NOT EXISTS deals_stripe_pi_idx ON public.deals (stripe_payment_intent_id);

-- Derive payment_cleared + commission eligibility from Stripe payment status / override.
CREATE OR REPLACE FUNCTION public.deals_set_commission_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Payment is only "cleared" when Stripe reports succeeded (never while pending/processing/failed).
  IF NEW.payment_status = 'succeeded' THEN
    NEW.payment_cleared := true;
    IF NEW.payment_cleared_at IS NULL THEN
      NEW.payment_cleared_at := now();
    END IF;
  ELSE
    NEW.payment_cleared := false;
    NEW.payment_cleared_at := NULL;
  END IF;

  -- Commission becomes eligible only when the payment cleared OR an admin overrides.
  IF (NEW.payment_cleared OR NEW.manual_override) THEN
    IF COALESCE(NEW.commission_status, 'pending') = 'pending' THEN
      NEW.commission_status := 'eligible';
    END IF;
    IF NEW.commission_eligible_at IS NULL THEN
      NEW.commission_eligible_at := now();
    END IF;
  ELSE
    -- Not cleared and no override: keep it pending (unless already marked paid by an admin).
    IF COALESCE(NEW.commission_status, 'pending') <> 'paid' THEN
      NEW.commission_status := 'pending';
      NEW.commission_eligible_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deals_commission_eligibility ON public.deals;
CREATE TRIGGER deals_commission_eligibility
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_set_commission_eligibility();

-- Prevent partners from self-awarding commission. Only partner-admins may change
-- payment/commission/override fields; everyone else is forced back to safe values.
CREATE OR REPLACE FUNCTION public.deals_protect_commission_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_partner_admin(auth.uid()) OR public.is_admin(auth.uid()) THEN
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

DROP TRIGGER IF EXISTS deals_protect_commission_fields ON public.deals;
CREATE TRIGGER deals_protect_commission_fields
  BEFORE INSERT OR UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.deals_protect_commission_fields();
