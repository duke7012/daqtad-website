# DA'QTAD — Kfans District

The website for DA'QTAD, a K-pop random play dance crew in Salt Lake City.

Plain HTML, CSS and JavaScript. No build step, no npm, no framework — the
files in `site/` are exactly what gets served. Content is edited from
`site/admin.html` and stored in a free Supabase database.

```
site/                     ← this folder is the website
  index.html              home
  events.html             all events
  gallery.html            photo gallery (click a photo for the lightbox)
  setlists.html           setlists per event, one tab per round
  event.html              every event gets a page here: event.html?slug=vol-9
  event-vol-8.html        hand-written page for Vol. 8 (optional extras)
  event-vol-7.html        hand-written page for Vol. 7
  about.html              story, world map, FAQ
  world-map.html          the map, embedded by about.html
  admin.html              ← EDIT THE SITE HERE (needs a login)
  404.html                shown for unknown URLs
  assets/
    css/styles.css        all styling
    css/admin.css         styling for the admin page only
    js/supabase-config.js ← PASTE YOUR DATABASE KEYS HERE
    js/store.js           loads content from the database
    js/data.js            sample content, used only if the database is down
    js/site.js            behaviour (countdown, tabs, lightbox, form)
    js/admin.js           the admin interface
    images/               images you add by hand (optional now — see admin)
supabase/
  schema.sql              tables, security rules, storage bucket
  seed.sql                the starter content, ready to import
prototype/                the original design-tool files, kept for reference
```

## Set up the database (about 10 minutes, once)

Until you do this the site still works — it just shows the sample content in
`data.js` and the admin page explains what's missing.

**1. Create the project.** Sign up at <https://supabase.com>, create a new
project, and pick a region near you. Save the database password somewhere safe.

**2. Create the tables.** In the left sidebar open **SQL Editor → New query**,
paste the whole of `supabase/schema.sql`, and press Run. It creates every
table, locks them down so only you can write to them, and makes a `media`
bucket for images.

**3. Import the existing content.** New query again, paste `supabase/seed.sql`,
Run. This loads the 135 songs, 5 events and 9 rounds the site already had.
Only run this once — running it again resets every setlist.

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

Redeploy, open `admin.html`, and sign in.

> These two values are public on purpose — they end up in the page source of
> every visitor. They are safe because the database only allows reading; every
> write is checked against the `admins` table. Never put the **secret** key
> (`sb_secret_…` / `service_role`) in this file.

## Editing the site

Open `/admin.html` and sign in. Everything below is editable there, and
changes appear on the live site as soon as you reload it — no redeploy.

**Events** — add, edit, delete. Fill in the name, date, time, venue and
whether song requests are open. Every event automatically gets a page at
`event.html?slug=…`, so adding an event never means adding a file. (The
"Custom page" box exists for the two hand-written pages; leave it blank.)

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

## Preview it locally

```bash
cd site
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Opening the HTML files directly with
`file://` mostly works, but the About page map won't load, so use the command
above.

## Deploy it

Any static host works. Easiest first:

**Netlify Drop** — go to <https://app.netlify.com/drop> and drag the `site`
folder onto the page. You get a live URL in about 20 seconds. To update it
later, drag the folder again.

**Cloudflare Pages / Netlify / Vercel (connected to Git)** — push this repo,
then set:

- Build command: *leave empty*
- Publish / output directory: `site`

`netlify.toml` and `vercel.json` already set this, so those two should just
work with no configuration.

**GitHub Pages** — Pages can only publish from the repo root or `/docs`, so
either rename `site` to `docs` and pick "main branch /docs" in settings, or
move the contents of `site/` to the repo root.

### After it's live

Search for `https://daqtad.com` and replace it with your real address. It
appears in the `canonical`/`og:` tags of each page, plus `robots.txt` and
`sitemap.xml`. From the project root:

```bash
grep -rl 'https://daqtad.com' site | xargs sed -i '' 's|https://daqtad.com|https://your-real-domain.com|g'
```

## Notes

- **If the database is ever unreachable** the site falls back to the last copy
  it loaded in that browser, and failing that to the sample content in
  `data.js`. Visitors never see an empty page.
- **Free Supabase projects pause after a week with no traffic.** A live site
  that people visit counts as traffic, so this only bites while the site is
  still private. If it pauses, resume it from the dashboard.
- Song requests are stored in the database and shown to everyone on the event
  page. If you ever disconnect the database, the form falls back to saving in
  the visitor's own browser.
- The countdown uses the event's start time and timezone, so it's correct for
  visitors anywhere in the world.
- Images you upload in the admin are served from Supabase. The hand-added
  files in `site/assets/images/` still work; anything missing shows a labelled
  placeholder rather than a broken image.
- The world map on the About page pulls country shapes from a CDN at page
  load. If that ever fails, it falls back to a plain text list of locations.
- Page headings and copy live in the HTML, so pages still have real text for
  search engines and link previews; only the lists are rendered by JavaScript.
