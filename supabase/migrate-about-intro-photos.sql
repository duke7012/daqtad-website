-- Allow About intro photos (section_id null). Safe to re-run.
alter table public.about_photos alter column section_id drop not null;
notify pgrst, 'reload schema';
