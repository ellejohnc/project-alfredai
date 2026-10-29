ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_approval_status_check;
ALTER TABLE public.deals ADD CONSTRAINT deals_approval_status_check
  CHECK (approval_status IN ('pending','approved','rejected'));

-- Existing cleared deals stay eligible so nothing regresses.
UPDATE public.deals SET approval_status = 'approved', approved_at = COALESCE(approved_at, now())
WHERE approval_status = 'pending' AND (payment_cleared OR manual_override OR commission_status IN ('eligible','paid'));

CREATE OR REPLACE FUNCTION public.deals_protect_commission_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();

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
    NEW.status := 'pending';
    NEW.approval_status := 'pending';
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
    NEW.approval_note := NULL;
  ELSE
    NEW.partner_id := OLD.partner_id;
    NEW.stripe_payment_intent_id := OLD.stripe_payment_intent_id;
    NEW.payment_status := OLD.payment_status;
    NEW.payment_cleared := OLD.payment_cleared;
    NEW.payment_cleared_at := OLD.payment_cleared_at;
    NEW.commission_status := OLD.commission_status;
    NEW.commission_eligible_at := OLD.commission_eligible_at;
    NEW.manual_override := OLD.manual_override;
    NEW.override_by := OLD.override_by;
    NEW.override_note := OLD.override_note;
    NEW.approval_status := OLD.approval_status;
    NEW.approved_by := OLD.approved_by;
    NEW.approved_at := OLD.approved_at;
    NEW.approval_note := OLD.approval_note;
    NEW.status := OLD.status;
    -- Commercial terms are locked once the deal is approved.
    IF OLD.approval_status = 'approved' THEN
      NEW.setup_fee := OLD.setup_fee;
      NEW.monthly_fee := OLD.monthly_fee;
      NEW.territory := OLD.territory;
      NEW.client_name := OLD.client_name;
      NEW.contact_email := OLD.contact_email;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.deals_set_commission_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.payment_status = 'succeeded' THEN
    NEW.payment_cleared := true;
    IF NEW.payment_cleared_at IS NULL THEN
      NEW.payment_cleared_at := now();
    END IF;
  ELSE
    NEW.payment_cleared := false;
    NEW.payment_cleared_at := NULL;
  END IF;

  -- Commission requires admin approval AND (cleared payment OR admin override).
  IF NEW.approval_status = 'approved' AND (NEW.payment_cleared OR NEW.manual_override) THEN
    IF COALESCE(NEW.commission_status, 'pending') = 'pending' THEN
      NEW.commission_status := 'eligible';
    END IF;
    IF NEW.commission_eligible_at IS NULL THEN
      NEW.commission_eligible_at := now();
    END IF;
  ELSE
    IF COALESCE(NEW.commission_status, 'pending') <> 'paid' THEN
      NEW.commission_status := 'pending';
      NEW.commission_eligible_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
