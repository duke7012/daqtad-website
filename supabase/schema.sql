-- ===========================================================================
-- DA'QTAD — database schema
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste →
-- Run. It is safe to re-run; everything is created "if not exists".
-- ===========================================================================

-- ---------------------------------------------------------------- tables ---

-- The song library. Add a song once, reuse it in any setlist.
create table if not exists public.songs (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  artist     text not null default '',
  created_at timestamptz not null default now()
);

-- Case-insensitive uniqueness so "Whiplash / aespa" can't be added twice.
create unique index if not exists songs_title_artist_key
  on public.songs (lower(title), lower(artist));

create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- e.g. vol-9 (used in the URL)
  name          text not null,                 -- "RPD Vol. 9"
  subtitle      text not null default '',      -- "Neon Nights"
  status        text not null default 'past'
                check (status in ('upcoming', 'past')),
  starts_at     timestamptz,                   -- drives the countdown
  ends_at       timestamptz,
  timezone      text not null default 'America/Denver',
  venue         text not null default '',
  venue_short   text not null default '',
  badge         text not null default '',      -- pill on the events page
  cta           text not null default '',      -- link text on cards
  stats         text not null default '',      -- "~60 dancers · 3 hours"
  poster_url    text not null default '',
  cover_url     text not null default '',
  video         text not null default '',      -- YouTube link or ID
  requests_open boolean not null default false,
  page          text not null default '',      -- blank => event.html?slug=...
  position      int not null default 0,        -- higher sorts first
  created_at    timestamptz not null default now()
);

create table if not exists public.rounds (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  label      text not null default 'Round 1',
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists rounds_event_idx on public.rounds (event_id, position);

-- Which songs are in a round, and in what order.
create table if not exists public.round_songs (
  id       uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  song_id  uuid not null references public.songs(id) on delete cascade,
  position int not null default 0
);

create index if not exists round_songs_round_idx
  on public.round_songs (round_id, position);

create table if not exists public.photos (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists photos_event_idx on public.photos (event_id, position);

create table if not exists public.faqs (
  id       uuid primary key default gen_random_uuid(),
  question text not null,
  answer   text not null default '',
  position int not null default 0
);

-- Song requests submitted by visitors from an event page.
create table if not exists public.song_requests (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.events(id) on delete cascade,
  name       text not null default 'anon',
  song       text not null,
  artist     text not null default '',
  part       text not null default '',  -- "which part? e.g. chorus"
  link       text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists song_requests_event_idx
  on public.song_requests (event_id, created_at desc);

-- Single row of site-wide settings, so links can change without editing code.
create table if not exists public.site_settings (
  id         boolean primary key default true check (id),
  instagram  text not null default 'https://instagram.com/daqtad',
  facebook   text not null default 'https://fb.com/daqtad',
  drive      text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

-- ----------------------------------------------------------- admin access --
-- Write access is granted only to users listed here, NOT to every logged-in
-- user. That way the site stays safe even if someone manages to sign up.

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ------------------------------------------------------------------- RLS ---

alter table public.songs         enable row level security;
alter table public.events        enable row level security;
alter table public.rounds        enable row level security;
alter table public.round_songs   enable row level security;
alter table public.photos        enable row level security;
alter table public.faqs          enable row level security;
alter table public.song_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.admins        enable row level security;

-- Anyone may read the public content.
do $$
declare t text;
begin
  foreach t in array array['songs', 'events', 'rounds', 'round_songs',
                           'photos', 'faqs', 'site_settings']
  loop
    execute format('drop policy if exists "public read" on public.%I;', t);
    execute format(
      'create policy "public read" on public.%I for select using (true);', t);

    execute format('drop policy if exists "admin write" on public.%I;', t);
    execute format(
      'create policy "admin write" on public.%I for all to authenticated ' ||
      'using (public.is_admin()) with check (public.is_admin());', t);
  end loop;
end $$;

-- Song requests: visitors may add and read them, only admins may remove them.
drop policy if exists "anyone may request" on public.song_requests;
create policy "anyone may request" on public.song_requests
  for insert to anon, authenticated with check (true);

drop policy if exists "public read requests" on public.song_requests;
create policy "public read requests" on public.song_requests
  for select using (true);

drop policy if exists "admin manages requests" on public.song_requests;
create policy "admin manages requests" on public.song_requests
  for delete to authenticated using (public.is_admin());

-- An admin may check whether they are an admin; nobody may edit the list from
-- the browser (add admins from the SQL editor).
drop policy if exists "admin reads self" on public.admins;
create policy "admin reads self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- grants ---

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on public.song_requests to anon;
grant execute on function public.is_admin() to anon, authenticated;

-- New tables added later inherit the same baseline.
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;

-- --------------------------------------------------------------- storage ---
-- Public bucket for posters and gallery photos uploaded from the admin.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "admin uploads media" on storage.objects;
create policy "admin uploads media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admin updates media" on storage.objects;
create policy "admin updates media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());

drop policy if exists "admin deletes media" on storage.objects;
create policy "admin deletes media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- ===========================================================================
-- LAST STEP — make yourself an admin.
--
--   1. Authentication → Users → "Add user" → create your email + password.
--   2. Run the line below with that email, then reload the admin page.
--
-- insert into public.admins (user_id, email)
-- select id, email from auth.users where email = 'you@example.com'
-- on conflict (user_id) do nothing;
-- ===========================================================================
