
-- ==== Guard: prevent privilege escalation via admin_users.role ====
CREATE OR REPLACE FUNCTION public.enforce_admin_users_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_is_super boolean := public.is_super_admin(v_caller);
  v_role_changed boolean := (TG_OP = 'INSERT') OR (NEW.role IS DISTINCT FROM OLD.role);
BEGIN
  -- Service-role / no auth context (e.g. migrations, edge fns) is trusted.
  IF v_caller IS NULL THEN
    RETURN NEW;
  END IF;

  IF v_is_super THEN
    RETURN NEW;
  END IF;

  -- Non super_admin path
  IF v_role_changed THEN
    -- Only super_admin may set an elevated role
    IF NEW.role IN ('admin'::app_role, 'super_admin'::app_role) THEN
      RAISE EXCEPTION 'Only a super_admin may assign the % role', NEW.role
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    -- No one may change their OWN role unless super_admin
    IF NEW.id = v_caller THEN
      RAISE EXCEPTION 'You may not change your own role'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_admin_users_role_change ON public.admin_users;
CREATE TRIGGER trg_enforce_admin_users_role_change
BEFORE INSERT OR UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.enforce_admin_users_role_change();

-- Also tighten the INSERT policy WITH CHECK so admins can't seed a super_admin row at all.
DROP POLICY IF EXISTS "Super admins and admins can insert admin users" ON public.admin_users;
CREATE POLICY "Super admins and admins can insert admin users"
ON public.admin_users
FOR INSERT
TO public
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND role NOT IN ('admin'::app_role, 'super_admin'::app_role)
  )
);

-- Add WITH CHECK to the admin UPDATE policy (previously null).
DROP POLICY IF EXISTS "Super admins and admins can update admin users" ON public.admin_users;
CREATE POLICY "Super admins and admins can update admin users"
ON public.admin_users
FOR UPDATE
TO public
USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND role NOT IN ('admin'::app_role, 'super_admin'::app_role)
  )
);

-- Restrict the "own last_login_at" self-update so a user cannot flip their own role via that policy.
DROP POLICY IF EXISTS "Users can update own last_login_at" ON public.admin_users;
CREATE POLICY "Users can update own last_login_at"
ON public.admin_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
-- (Role change on own row is now also blocked by the trigger above.)


-- ==== Guard: prevent invitation-based privilege escalation ====
CREATE OR REPLACE FUNCTION public.enforce_pending_invitations_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RETURN NEW; -- service-role / trusted contexts
  END IF;

  IF public.is_super_admin(v_caller) THEN
    RETURN NEW;
  END IF;

  -- Non super_admin: may only invite non-elevated roles (editor / sales_rep, etc.)
  IF NEW.role IN ('admin'::app_role, 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Only a super_admin may invite users with the % role', NEW.role
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_pending_invitations_role ON public.pending_invitations;
CREATE TRIGGER trg_enforce_pending_invitations_role
BEFORE INSERT OR UPDATE ON public.pending_invitations
FOR EACH ROW EXECUTE FUNCTION public.enforce_pending_invitations_role();

-- Also tighten the INSERT policy WITH CHECK.
DROP POLICY IF EXISTS "Admins can create invitations" ON public.pending_invitations;
CREATE POLICY "Admins can create invitations"
ON public.pending_invitations
FOR INSERT
TO public
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND role NOT IN ('admin'::app_role, 'super_admin'::app_role)
  )
);
