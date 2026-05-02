-- Track when each user last received their bookmark digest email
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_bookmark_email_at timestamptz;
