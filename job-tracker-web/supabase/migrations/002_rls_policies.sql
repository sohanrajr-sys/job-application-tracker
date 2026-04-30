-- PROFILES RLS
alter table public.profiles enable row level security;

create policy "users_read_own" on public.profiles for select using (auth.uid() = id);
create policy "users_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admins_read_all_profiles" on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- APPLICATIONS RLS
alter table public.applications enable row level security;

create policy "users_crud_own_applications" on public.applications for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admins_read_all_applications" on public.applications for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- REMINDERS RLS
alter table public.reminders enable row level security;

create policy "users_crud_own_reminders" on public.reminders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- APPLICATION EVENTS RLS
alter table public.application_events enable row level security;

create policy "users_read_own_events" on public.application_events for select using (auth.uid() = user_id);
create policy "users_insert_own_events" on public.application_events for insert with check (auth.uid() = user_id);
create policy "admins_read_all_events" on public.application_events for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
