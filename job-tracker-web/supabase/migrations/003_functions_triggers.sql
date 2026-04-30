-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger set_applications_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Log status changes to events table
create or replace function public.log_status_change()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    insert into public.application_events (application_id, user_id, event_type, old_value, new_value)
    values (new.id, new.user_id, 'status_changed', old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger log_application_status
  after update on public.applications
  for each row execute procedure public.log_status_change();

-- Lookup user by extension token (used by sync API)
create or replace function public.get_user_by_extension_token(token uuid)
returns uuid language sql security definer stable as $$
  select id from public.profiles where extension_token = token limit 1;
$$;
