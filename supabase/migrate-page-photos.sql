-- Photo upload tables for About + Extras (safe to re-run)
-- Supabase → SQL Editor → paste → Run, then reload /admin

create table if not exists public.about_photos (
  id         uuid primary key default gen_random_uuid(),
  band       text not null check (band in ('mosaic', 'vietnam', 'utah')),
  url        text not null,
  alt        text not null default '',
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists about_photos_band_idx on public.about_photos (band, position);

create table if not exists public.extras_photos (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.extras_projects(id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists extras_photos_project_idx on public.extras_photos (project_id, position);

alter table public.about_photos  enable row level security;
alter table public.extras_photos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['about_photos', 'extras_photos']
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

grant select on public.about_photos to anon, authenticated;
grant select on public.extras_photos to anon, authenticated;
grant insert, update, delete on public.about_photos to authenticated;
grant insert, update, delete on public.extras_photos to authenticated;

notify pgrst, 'reload schema';
