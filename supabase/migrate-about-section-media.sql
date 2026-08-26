-- Per-section About photos + videos (safe to re-run)
-- Supabase → SQL Editor → paste → Run, then reload /admin

alter table public.about_sections add column if not exists videos text not null default '';

-- Replace band-based about_photos with section-linked photos (like extras_photos).
drop table if exists public.about_photos;

create table public.about_photos (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.about_sections(id) on delete cascade,
  url        text not null,
  alt        text not null default '',
  position   int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists about_photos_section_idx on public.about_photos (section_id, position);

alter table public.about_photos enable row level security;

do $$
begin
  drop policy if exists "public read" on public.about_photos;
  create policy "public read" on public.about_photos for select using (true);

  drop policy if exists "admin write" on public.about_photos;
  create policy "admin write" on public.about_photos for all to authenticated
    using (public.is_admin()) with check (public.is_admin());
end $$;

grant select on public.about_photos to anon, authenticated;
grant insert, update, delete on public.about_photos to authenticated;

-- Clear old band assignments on sections
update public.about_sections set photo_band = '' where photo_band is not null and photo_band <> '';

-- Remove prohibited em dashes from About / Extras / FAQ copy already in the DB
update public.about_sections set
  heading = replace(heading, '—', '-'),
  body = replace(body, '—', '-'),
  mission = replace(mission, '—', '-'),
  closing = replace(closing, '—', '-'),
  link_label = replace(link_label, '—', '-'),
  videos = coalesce(videos, '');
update public.extras_projects set
  title = replace(title, '—', '-'),
  eyebrow = replace(eyebrow, '—', '-'),
  body = replace(body, '—', '-'),
  videos = replace(videos, '—', '-');
update public.faqs set
  question = replace(question, '—', '-'),
  answer = replace(answer, '—', '-');
update public.site_settings set
  about_title = replace(about_title, '—', '-'),
  about_intro = replace(about_intro, '—', '-'),
  extras_title = replace(extras_title, '—', '-'),
  extras_intro = replace(extras_intro, '—', '-');

update public.events set
  name = replace(name, '—', '-'),
  subtitle = replace(coalesce(subtitle, ''), '—', '-'),
  badge = replace(coalesce(badge, ''), '—', '-'),
  cta = replace(coalesce(cta, ''), '—', '-'),
  stats = replace(coalesce(stats, ''), '—', '-');

notify pgrst, 'reload schema';
