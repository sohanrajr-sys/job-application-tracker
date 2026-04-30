-- Add onboarding flag so new users are guided to set up the extension
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false;

-- Existing users are already set up — mark them done so they're not redirected
UPDATE public.profiles SET onboarding_done = true WHERE onboarding_done = false;

-- Rotate extension token (called from dashboard via anon client)
CREATE OR REPLACE FUNCTION public.rotate_extension_token(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token uuid;
BEGIN
  IF auth.uid() IS DISTINCT FROM user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  v_new_token := gen_random_uuid();
  UPDATE public.profiles SET extension_token = v_new_token WHERE id = user_id;
  RETURN v_new_token;
END;
$$;

-- Mark onboarding complete for current user
CREATE OR REPLACE FUNCTION public.complete_onboarding()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET onboarding_done = true WHERE id = auth.uid();
END;
$$;
