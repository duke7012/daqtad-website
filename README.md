# DA'QTAD — Kfans District

The website for DA'QTAD, a K-pop random play dance crew in Salt Lake City.

Plain HTML, CSS and JavaScript. No build step, no npm, no framework — the
files in `site/` are exactly what gets served.

```
site/                     ← this folder is the website
  index.html              home
  events.html             all events
  gallery.html            photo gallery (click a photo for the lightbox)
  setlists.html           setlists per event, one tab per round
  event-vol-8.html        upcoming event + countdown + song requests
  event-vol-7.html        past event + photos + recap video + setlist
  about.html              story, world map, FAQ
  world-map.html          the map, embedded by about.html
  404.html                shown for unknown URLs
  assets/
    css/styles.css        all styling
    js/data.js            ← ALL CONTENT LIVES HERE
    js/site.js            behaviour (countdown, tabs, lightbox, form)
    images/               your photos (see assets/images/README.md)
prototype/                the original design-tool files, kept for reference
```

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

## Updating the site

### Photos and posters

Drop image files into `site/assets/images/` using the filenames listed in
`site/assets/images/README.md`. Any image you haven't added yet shows a
labelled placeholder box instead of a broken image, so the site always looks
intentional.

### Events, setlists, FAQ

Everything is in `site/assets/js/data.js` — one file, plain English, with
comments explaining each field. Save it, refresh the page, done.

To add a new event: copy an existing block in the `events` array, change the
values, and set the previous event's `status` from `'upcoming'` to `'past'`.
The home page, events page, gallery, setlists and countdown all update
themselves.

To give the new event its own page, copy `event-vol-8.html`, and change
`data-event="vol-8"` in the `<body>` tag to the new event's `slug`.

### Song requests

Right now requests are saved only in the visitor's own browser — good for
testing, but you won't receive them. To actually collect them, open
`site/assets/js/data.js` and set the `endpoint` in the `requests` block:

- **Formspree** (works on any host): create a form at <https://formspree.io>,
  then set `endpoint: 'https://formspree.io/f/yourFormId'`.
- **Netlify**: if you deploy on Netlify, set `endpoint: 'netlify'`. The form
  is already marked up for it; submissions appear under Forms in your
  Netlify dashboard.

## Notes

- The countdown uses the `startsAt` time in `data.js`, including the timezone
  offset (`-06:00` for Utah in summer, `-07:00` in winter), so it's correct
  for visitors anywhere in the world.
- The world map on the About page pulls country shapes from a CDN at page
  load. If that ever fails, it falls back to a plain text list of locations.
- Event lists, gallery and setlists are rendered by JavaScript from
  `data.js`. Page headings and copy are in the HTML, so pages still have real
  text for search engines and link previews.
