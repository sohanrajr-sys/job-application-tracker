-- ============================================================
-- SECURITY HARDENING
-- Run this in Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Prevent users from escalating their own role
--    auth.uid() returns NULL when called by service_role, so this
--    trigger only blocks regular user-initiated role changes.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot change role directly';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();


-- 2. Prevent reminders being sent to arbitrary email addresses.
--    Enforces email_to = the authenticated user's email in auth.users.
CREATE OR REPLACE FUNCTION public.validate_reminder_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  IF NEW.email_to IS NOT NULL AND lower(trim(NEW.email_to)) != lower(trim(v_email)) THEN
    RAISE EXCEPTION 'email_to must match your account email';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_reminder_email ON public.reminders;
CREATE TRIGGER trg_validate_reminder_email
  BEFORE INSERT OR UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_reminder_email();
