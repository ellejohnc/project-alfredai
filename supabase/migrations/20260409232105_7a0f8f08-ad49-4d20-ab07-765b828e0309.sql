-- Add sales_rep to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_rep';

-- Update is_admin to include sales_rep
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('admin', 'editor', 'super_admin', 'sales_rep')
  )
$function$;