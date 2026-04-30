create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  full_name        text,
  avatar_url       text,
  role             text not null default 'user' check (role in ('user', 'admin')),
  extension_token  uuid not null default uuid_generate_v4() unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- APPLICATIONS
create table public.applications (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  company      text not null,
  title        text not null,
  url          text,
  platform     text not null default 'unknown',
  status       text not null default 'applied'
                 check (status in ('applied','screening','interview','offer','rejected','withdrawn','saved')),
  applied_at   timestamptz not null default now(),
  bookmarked   boolean not null default false,
  notes        text,
  salary_min   integer,
  salary_max   integer,
  location     text,
  remote       boolean,
  source       text default 'extension' check (source in ('extension','manual')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_applications_user_id    on public.applications(user_id);
create index idx_applications_applied_at on public.applications(applied_at desc);
create index idx_applications_platform   on public.applications(platform);
create index idx_applications_status     on public.applications(status);
create index idx_applications_bookmarked on public.applications(bookmarked) where bookmarked = true;

alter table public.applications
  add constraint applications_user_url_title_unique unique (user_id, url, title);

-- REMINDERS
create table public.reminders (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  application_id  uuid references public.applications(id) on delete set null,
  title           text not null,
  message         text,
  remind_at       timestamptz not null,
  sent            boolean not null default false,
  sent_at         timestamptz,
  email_to        text not null,
  created_at      timestamptz not null default now()
);

create index idx_reminders_user_id   on public.reminders(user_id);
create index idx_reminders_remind_at on public.reminders(remind_at) where sent = false;

-- APPLICATION EVENTS
create table public.application_events (
  id              uuid primary key default uuid_generate_v4(),
  application_id  uuid not null references public.applications(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  event_type      text not null check (event_type in ('created','status_changed','bookmarked','note_added')),
  old_value       text,
  new_value       text,
  created_at      timestamptz not null default now()
);

create index idx_events_application_id on public.application_events(application_id);
create index idx_events_user_id        on public.application_events(user_id);
