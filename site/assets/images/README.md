# Images

Drop your photos in here using these exact filenames. Anything missing just
shows a labelled placeholder box on the site — nothing breaks.

JPG is expected (`.jpg`). If you'd rather use `.png` or `.webp`, change the
filename in `assets/js/data.js` to match.

## Site-wide

| File | Used on | Suggested size |
| --- | --- | --- |
| `hero.gif` (or `.jpg`) | Home page hero background | 1600 × 900, landscape |
| `about-group.jpg` | About page group photo | 800 × 800, square |
| `og-cover.jpg` | Link preview when the site is shared | 1200 × 630 |

## Events — `assets/images/events/`

Two images per event:

- `vol-8-poster.jpg` — the event poster, portrait 4:5 (e.g. 1080 × 1350)
- `vol-8-cover.jpg` — a wide photo for the event cards, 16:9

Same pattern for `vol-7`, `vol-6`, `vol-5`, `vol-4`.

## Gallery — `assets/images/gallery/`

Numbered per event, starting at 01:

```
vol-7-01.jpg  vol-7-02.jpg  ...  vol-7-08.jpg
vol-6-01.jpg  ...  vol-6-06.jpg
vol-5-01.jpg  ...  vol-5-06.jpg
vol-4-01.jpg  ...  vol-4-06.jpg
```

The number of photos per event is set in `assets/js/data.js` — look for
`photos('vol-7', 8, ...)` and change the `8`.

## Before uploading

Resize photos to about 1600px on the long edge and save at ~80% quality.
Straight-from-the-camera files are often 5–10 MB each and will make the
gallery slow on phones.
