# Images

Drop your photos in here using these exact filenames. Anything missing just
shows a labelled placeholder box on the site — nothing breaks.

JPG is expected (`.jpg`). If you'd rather use `.png` or `.webp`, change the
filename in `assets/js/data.js` to match.

## Site-wide

| File | Used on | Suggested size |
| --- | --- | --- |
| `homepage_background.mp4` | Home page hero background video (muted, loops) | 1600 × 900 |
| `hero.jpg` | Hero still (poster + reduced-motion fallback) | 1600 × 900, landscape |
| `about-group.jpg` | About page group photo | 800 × 800, square |
| `og-cover.jpg` | Link preview when the site is shared | 1200 × 630 |

## Events — `assets/images/events/`

Two images per event:

- `popup-poster.jpg` — the event poster, portrait 4:5 (e.g. 1080 × 1350)
- `popup-cover.jpg` — a wide photo for the event cards, 16:9

Same pattern for `rpd-ut2`, `rpd-ut1`, `rdd-6`, and so on.

## Gallery — `assets/images/gallery/`

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
