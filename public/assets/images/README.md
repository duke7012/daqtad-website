# Images

Drop your photos in here using these exact filenames. Anything missing just
shows a labelled placeholder box on the site - nothing breaks.

JPG is expected (`.jpg`). If you'd rather use `.png` or `.webp`, change the
filename in the matching route / content file to match.

## Site-wide

| File | Used on | Suggested size |
| --- | --- | --- |
| `homepage_background.mp4` | Home page hero background video (muted, loops) | 1600 × 900 |
| `hero.jpg` | Hero still (poster + reduced-motion fallback) | 1600 × 900, landscape |
| `og-cover.jpg` | Link preview when the site is shared | 1200 × 630 |

## About - `assets/images/about/`

Prefer uploading from **Admin → About** (hero mosaic, Vietnam band, Utah band).
Legacy static defaults still work if no uploads exist yet:

| File | Used on | Suggested size |
| --- | --- | --- |
| `mosaic-01.jpg` … `mosaic-04.jpg` | About hero mosaic fallback | 1200 × 900+ |
| `vietnam-01.jpg` … `vietnam-03.jpg` | Vietnam band fallback | 1200 × 900 |
| `utah-01.jpg` … `utah-03.jpg` | Utah band fallback | 1200 × 900 |

## Extras

Upload photos per project from **Admin → Extras**. They are stored in Supabase
Storage and shown on that project’s article.

## Events - `assets/images/events/`

Two images per event:

- `popup-poster.jpg` - the event poster, portrait 4:5 (e.g. 1080 × 1350)
- `popup-cover.jpg` - a wide photo for the event cards, 16:9

Same pattern for `rpd-ut2`, `rpd-ut1`, `rdd-6`, and so on.

## Gallery - `assets/images/gallery/`

Numbered per event, starting at 01:

```
rpd-ut2-01.jpg  rpd-ut2-02.jpg  ...
rpd-ut1-01.jpg  ...
```

The number of photos per event is set in the admin (or in `assets/js/data.js`
for the offline fallback).

## Before uploading

Resize photos to about 1600px on the long edge and save at ~80% quality.
Straight-from-the-camera files are often 5–10 MB each and will make the
gallery slow on phones.
