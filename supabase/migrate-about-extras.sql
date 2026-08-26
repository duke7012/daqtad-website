-- About + Extras tables (safe to re-run)
-- Supabase → SQL Editor → New query → paste → Run

alter table public.site_settings add column if not exists about_title text not null default 'About DA''QTAD';
alter table public.site_settings add column if not exists about_pronunciation text not null default '/duh-kah-taht/';
alter table public.site_settings add column if not exists about_intro text not null default '';
alter table public.site_settings add column if not exists about_mosaic_photos text not null default '';
alter table public.site_settings add column if not exists about_vietnam_photos text not null default '';
alter table public.site_settings add column if not exists about_utah_photos text not null default '';
alter table public.site_settings add column if not exists extras_title text not null default 'Extras';
alter table public.site_settings add column if not exists extras_intro text not null default '';

create table if not exists public.about_sections (
  id          uuid primary key default gen_random_uuid(),
  heading     text not null default '',
  body        text not null default '',
  mission     text not null default '',
  closing     text not null default '',
  link_label  text not null default '',
  link_href   text not null default '',
  photo_band  text not null default '',
  position    int not null default 0
);
alter table public.about_sections add column if not exists photo_band text not null default '';

create table if not exists public.extras_projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null default '',
  title       text not null default '',
  eyebrow     text not null default '',
  body        text not null default '',
  videos      text not null default '',
  photo_count int not null default 0,
  position    int not null default 0
);
alter table public.extras_projects add column if not exists videos text not null default '';
alter table public.extras_projects add column if not exists photo_count int not null default 0;

alter table public.about_sections  enable row level security;
alter table public.extras_projects enable row level security;

do $$
declare t text;
begin
  foreach t in array array['about_sections', 'extras_projects']
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

grant select on public.about_sections to anon, authenticated;
grant select on public.extras_projects to anon, authenticated;
grant insert, update, delete on public.about_sections to authenticated;
grant insert, update, delete on public.extras_projects to authenticated;

-- Seed current About / Extras copy
update public.site_settings set
  about_title = 'About DA''QTAD',
  about_pronunciation = '/duh-kah-taht/',
  about_intro = E'**DA''QTAD** is a K-pop community originally founded in **Bến Tre City, Vietnam, in 2019** by a group of high school friends: (Tâm) Đan, (Trúc) An, (Thúy) Quyên, (Phan) Thông, (Trúc) Anh, and Duke.\n\nWhat started as a shared love for K-pop quickly became something bigger. We wanted to bring K-pop events closer to our local community, especially **K-pop Random Play Dance**, or RPD, where fans gather, recognize songs as they play, jump onto the dance floor, and perform the choreography together.',
  about_mosaic_photos = E'/assets/images/about/mosaic-01.jpg|DA''QTAD community at a Random Play Dance\n/assets/images/about/mosaic-02.jpg|Fans dancing together at a DA''QTAD event\n/assets/images/about/mosaic-03.jpg|DA''QTAD organizers and friends\n/assets/images/about/mosaic-04.jpg|Crowd energy at a DA''QTAD Random Play Dance',
  about_vietnam_photos = E'/assets/images/about/vietnam-01.jpg|DA''QTAD Random Play Dance in Bến Tre, Vietnam\n/assets/images/about/vietnam-02.jpg|K-pop fans at a DA''QTAD event in Bến Tre\n/assets/images/about/vietnam-03.jpg|DA''QTAD community gathering in Vietnam',
  about_utah_photos = E'/assets/images/about/utah-01.jpg|DA''QTAD USA Random Play Dance in Salt Lake City\n/assets/images/about/utah-02.jpg|Fans at a DA''QTAD event in Utah\n/assets/images/about/utah-03.jpg|DA''QTAD USA crew in Salt Lake City',
  extras_title = 'Extras',
  extras_intro = E'DA''QTAD has never been only about dancing. These are the community projects we built beyond Random Play Dance: volunteering, creative campaigns, and ways to stay connected when we couldn''t gather in person.'
where id = true;

delete from public.about_sections;
insert into public.about_sections (heading, body, mission, closing, link_label, link_href, photo_band, position) values
  (
    'Our Beginning in Vietnam',
    E'Since 2019, DA''QTAD has organized **6 official Random Play Dance events in Bến Tre**, welcoming more than **1,000 participants** in total. We also expanded beyond our main events with special spin-offs, including an RPD held during a university military bootcamp in collaboration with IEF and an online livestreamed RPD during the COVID-19 period.\n\nFor us, DA''QTAD has never been only about dancing. It has always been about creating a place where K-pop fans can meet, connect, have fun, and feel part of a community.',
    '', '', '', '', 'vietnam', 0
  ),
  (
    'More Than Random Play Dance',
    E'During our time in Vietnam, we also used our community to create meaningful projects beyond K-pop events: charity work, an international flashmob, and an online radio series.',
    '', '', 'Explore Extras →', '/extras', '', 1
  ),
  (
    'A New Chapter',
    E'After COVID-19, the original DA''QTAD members gradually began pursuing different paths around the world. Đan moved to Australia for higher education, An continued her studies in Japan, Quyên and Thông began focusing on their careers, and Duke moved to the United States for university.\n\nBut the DA''QTAD story did not end there.\n\nAfter moving to Salt Lake City, Duke decided to continue the tradition of bringing K-pop fans together and introduced DA''QTAD to the Utah community.\n\nTogether with **Hanni, Phoebe, Vy, and Dinh**, he formed **DA''QTAD USA**, affectionately giving the name a new meaning: **The (da) Cutie (qt) Admins (ad).**',
    '', '', '', '', '', 2
  ),
  (
    'DA''QTAD USA',
    E'In **2025 and 2026**, DA''QTAD USA organized **two large-scale K-pop Random Play Dance events in Utah**, welcoming more than **200 attendees combined**.\n\nOur Salt Lake City events have continued the same spirit that started in Bến Tre years ago: an open dance floor, a carefully curated playlist, lots of energy, and a welcoming space where everyone can celebrate K-pop together.\n\nNow, DA''QTAD USA is beginning to expand beyond our own independent events through collaborations, festivals, pop-ups, and conventions. Our participation with **Bopsim** marks our first pop-up event outside of Vietnam and another exciting step in bringing the DA''QTAD experience to new communities.',
    '', '', '', '', 'utah', 3
  ),
  (
    'What DA''QTAD Means to Us',
    E'DA''QTAD began with six high school friends who simply wanted more K-pop activities in their hometown. Years later, that same idea continues across countries and communities.\n\nWhether we are organizing a Random Play Dance, creating an online project, volunteering, collaborating with other organizations, or simply giving fans a place to dance together, our goal remains the same:',
    'Bring people together through K-pop, create unforgettable memories, and keep the Random Play Dance energy alive wherever we go.',
    'From **Bến Tre to Salt Lake City**, this is DA''QTAD.',
    '', '', '', 4
  );

delete from public.extras_projects;
insert into public.extras_projects (slug, title, eyebrow, body, videos, photo_count, position) values
  (
    'charity',
    'Charity Visit: Chùa Phật Minh',
    'Volunteer · Bến Tre',
    E'We organized a charity visit to **Chùa Phật Minh (Từ Tâm)** in Bến Tre, where DA''QTAD and local K-pop fans donated gifts to orphaned children.',
    '', 0, 0
  ),
  (
    '100-project',
    'The 100 Project',
    'International flashmob · COVID-19',
    E'During the COVID-19 pandemic, we launched **The 100 Project**, an international online flashmob inspired by the Vietnamese song **"Ghen Cô-Vy."** The project was created to spread positivity and encourage people to protect themselves during the pandemic.\n\nAlthough our original goal was to bring together 100 dancers, the final project connected **30 dancers from 6 different countries**.',
    '', 0, 1
  ),
  (
    'radionair',
    'radiONair',
    'Online radio series',
    E'We also created **radiONair**, our online radio series where K-pop fans could join us to talk about music, request their favorite songs, and participate in interactive K-pop games while everyone was staying connected from home.',
    '', 0, 2
  );

notify pgrst, 'reload schema';
