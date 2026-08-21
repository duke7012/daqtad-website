# DA'QTAD — Kfans District

The website for DA'QTAD, a K-pop random play dance crew in Salt Lake City.

|            |                                                                    |
| ---------- | ------------------------------------------------------------------ |
| Live at    | <https://daqtad.org>                                                 |
| Edit at    | <https://daqtad.org/admin> (needs a login)                           |
| Domain     | registered at Porkbun                                                |
| Hosting    | Netlify, deploying from `main` on <https://github.com/duke7012/daqtad-website> |
| Content    | a free Supabase project                                              |

Plain HTML, CSS and JavaScript. No build step, no npm, no framework — the
files in `site/` are exactly what gets served.

## Addresses

There is no `.html` anywhere in the address bar.

```
/                  home
/events            all events
/events/popup      Spin-Off (Pop-Up)  (hand-written page)
/events/<slug>     every other event, rendered from the database
/gallery           photo gallery
/setlists          setlists, one tab per round
/about             story, world map, FAQ
/admin             edit the site
```

Adding an event in the admin gives it `/events/<its-slug>` straight away — no
new file and no deploy. `netlify.toml` maps addresses to files, and the old
`.html` addresses redirect to the new ones, so links shared before the change
still work.

## Files

```
site/                     ← this folder is the website
  index.html              /
  events.html             /events
  event.html              /events/<slug> — the generic event page
  event-popup.html        /events/popup
  gallery.html            /gallery
  setlists.html           /setlists
  about.html              /about
  world-map.html          the map embedded by the About page
  admin.html              /admin  ← EDIT THE SITE HERE
  404.html                shown for unknown addresses
  assets/
    css/styles.css        all styling
    css/admin.css         styling for the admin page only
    js/supabase-config.js ← YOUR DATABASE KEYS GO HERE
    js/store.js           loads content from the database
    js/data.js            sample content, used only if the database is down
    js/site.js            behaviour (countdown, tabs, lightbox, request form)
    js/admin.js           the admin interface
    images/               images you add by hand (optional — see admin)
netlify.toml              addresses, redirects and headers
serve.py                  local preview, using those same rules
supabase/
  schema.sql              tables, security rules, storage bucket
  seed.sql                the starter content, ready to import
prototype/                the original design-tool files, kept for reference
```

## Preview it locally

```bash
python3 serve.py
```

Then open <http://localhost:8000>. It reads `netlify.toml`, so the clean
addresses and redirects behave exactly as they do live. (`python3 -m
http.server` from inside `site/` still works for a quick look, but
`/events/rdd-6` won't resolve, because that address is a rewrite rather than a
file.)

## Set up the database (about 10 minutes, once)

Until you do this the site still works — it just shows the sample content in
`data.js`, and the admin page explains what's missing.

**1. Create the project.** Sign up at <https://supabase.com>, create a new
project, and pick a region near you. Save the database password somewhere safe.

**2. Create the tables.** In the left sidebar open **SQL Editor → New query**,
paste the whole of `supabase/schema.sql`, and press Run. It creates every
table, locks them down so only you can write to them, and makes a `media`
bucket for images. Running it again is safe and leaves your content alone, so
re-run it whenever the file changes to pick up the newest security rules.

**3. Import the existing content.** New query again, paste `supabase/seed.sql`,
Run. This loads the song library, the real event setlists (names and
dates taken from the song-list filenames), and the upcoming Spin-Off
(Pop-Up) at Bopsim. Only run this once — running it again resets every setlist.

**4. Make yourself the admin.** Go to **Authentication → Users → Add user**,
and create a user with your email and a password (tick "Auto Confirm User").
Then back in the SQL Editor, run this with your own email:

```sql
insert into public.admins (user_id, email)
select id, email from auth.users where email = 'you@example.com';
```

**5. Connect the site.** Go to **Project Settings → API keys**. Copy the
Project URL and the publishable key (it starts with `sb_publishable_`; on older
projects it's called the `anon` key). Paste both into
`site/assets/js/supabase-config.js`:

```js
window.SUPABASE_CONFIG = {
  url: 'https://yourproject.supabase.co',
  key: 'sb_publishable_xxxxxxxxxxxxx'
};
```

Push, wait for Netlify to deploy, then open <https://daqtad.org/admin> and sign
in.

> These two values are public on purpose — they end up in the page source of
> every visitor. They are safe because the database only allows reading, apart
> from song requests, which are accepted only while that event has requests
> open; every other write is checked against the `admins` table. Never put the
> **secret** key (`sb_secret_…` / `service_role`) in this file.

### If you imported the seed before the addresses changed

Older rows store paths like `assets/images/…` and `event-vol-8.html`. The site
copes with both — it adds the leading slash, and the old page addresses
redirect — but one run of this in the SQL Editor tidies them up for good:

```sql
update public.events
   set page = '/events/' || slug
 where page in ('event-vol-8.html', 'event-vol-7.html');

update public.events
   set poster_url = '/' || poster_url
 where poster_url <> '' and poster_url not like '/%' and poster_url not like 'http%';

update public.events
   set cover_url = '/' || cover_url
 where cover_url <> '' and cover_url not like '/%' and cover_url not like 'http%';

update public.photos
   set url = '/' || url
 where url <> '' and url not like '/%' and url not like 'http%';
```

## Deploying

Netlify is connected to the GitHub repo, so **pushing to `main` deploys the
site**. There is nothing to build:

- Build command: *empty*
- Publish directory: `site`

`netlify.toml` already sets this, along with the addresses and the caching and
security headers. A pull request gets its own preview URL.

## The domain

`daqtad.org` is registered at Porkbun, and Porkbun keeps control of DNS —
Netlify only serves the site. In Netlify, the domain is added under **Domain
management → Add a domain**, with `daqtad.org` as the primary domain.

At Porkbun, under **Details → DNS** for the domain, delete the default
`pixie.porkbun.com` records and add these two:

| Type    | Host    | Answer                          |
| ------- | ------- | ------------------------------- |
| `ALIAS` | *empty* | `apex-loadbalancer.netlify.com` |
| `CNAME` | `www`   | `<your-site>.netlify.app`       |

Porkbun supports `ALIAS` records, which is what Netlify recommends for an apex
domain like this one. If you ever need the fallback instead, use an `A` record
on the empty host pointing at `75.2.60.5`.

Two things to watch:

- Remove any leftover `A` or `AAAA` records on the bare domain. More than one
  will stop Netlify from issuing the HTTPS certificate.
- Don't switch Porkbun's nameservers to Netlify DNS while these records exist.
  Use one or the other, not both.

DNS can take up to 48 hours to spread, though it is usually minutes. Netlify
issues the HTTPS certificate automatically once it resolves, and redirects
`www.daqtad.org` to `daqtad.org`.

## Editing the site

Open <https://daqtad.org/admin> and sign in. Everything below is editable
there, and changes appear on the live site as soon as you reload it — no
redeploy.

**Events** — add, edit, delete. Fill in the name, date, time, venue and
whether song requests are open. Every event automatically gets a page at
`/events/<slug>`, so adding an event never means adding a file. (The "Custom
page" box exists for the two hand-written pages; leave it blank.)

**Rounds and setlists** — open an event, add a round, then open the round.
The fastest way to load ~100 songs is the **Paste a setlist** box: one song
per line as `Title — Artist`. Leading numbers like `12.` are ignored, and any
song not already in the library is added to it automatically.

```
1. Whiplash — aespa
2. APT. — ROSÉ & Bruno Mars
3. How Sweet — NewJeans
```

**Song library** — the pool every setlist draws from. Search it, fix a typo
(which corrects it in every setlist at once), add songs one at a time, or
import a big list. Deleting a song removes it from every setlist, so be
careful there.

**Photos** — open an event and upload straight from your phone or laptop.
They go to Supabase Storage and show up on the gallery page and that event's
page. Add a short description to each one for screen readers.

**FAQ and Settings** — the About page questions, and the Instagram / Facebook
/ Google Drive links used across the site.

**Requests** — everything visitors submitted through an event page, newest
first, with a delete button for spam.

## Adding a new event page by hand

Almost never needed — the admin covers it. But if an event deserves a
one-off layout like the Pop-Up has:

1. Copy `site/event-popup.html` to `site/event-rdd-9.html` and edit it. Set
   `data-event="rdd-9"` on the `<body>` tag so it loads that event's content.
2. In `netlify.toml`, copy the `/events/popup` pair of rules and change the
   slug.
3. In the admin, set that event's **Custom page** to `/events/rdd-9`.
4. Add the address to `site/sitemap.xml`.

## Notes

- **If the database is ever unreachable** the site falls back to the last copy
  it loaded in that browser, and failing that to the sample content in
  `data.js`. Visitors never see an empty page.
- **Free Supabase projects pause after a week with no traffic.** A live site
  that people visit counts as traffic. If it does pause, resume it from the
  dashboard.
- Song requests are stored in the database and shown to everyone on the event
  page. The database only accepts a request while that event has requests open.
- The countdown uses the event's start time and timezone, so it's correct for
  visitors anywhere in the world.
- Images you upload in the admin are served from Supabase. The hand-added
  files in `site/assets/images/` still work; anything missing shows a labelled
  placeholder rather than a broken image.
- Paths stored in the database should start with `/` (for example
  `/assets/images/events/popup-poster.jpg`). The site adds the slash if it is
  missing, so an older row still resolves.
- The world map on the About page pulls country shapes from a CDN at page
  load. If that ever fails, it falls back to a plain text list of locations.
- Page headings and copy live in the HTML, so pages still have real text for
  search engines and link previews; only the lists are rendered by JavaScript.
