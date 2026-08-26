import { DriveLink } from "~/components/DriveLink";
import { PhotoGrid } from "~/components/PhotoGrid";
import { loadSite, pastEvents } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
import type { Route } from "./+types/gallery";

export async function loader() {
  const site = await loadSite();
  return {
    groups: pastEvents(site).filter((ev) => ev.photos && ev.photos.length),
  };
}

export function meta() {
  return pageMeta({
    title: "Gallery - DA'QTAD Kfans District",
    description: "Photos from every DA'QTAD K-pop random play dance in Salt Lake City and Bến Tre. Free to download and share.",
    path: "/gallery",
  });
}

export default function Gallery({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main">
      <section className="section">
        <h1 className="h1">Gallery</h1>
        <p className="lede">
          Favorite moments from every RPD. Tap a photo to view it full size - everything is free to download and repost
          (tag us 💜).
        </p>
      </section>

      {!loaderData.groups.length ? (
        <section className="section section--last">
          <div className="notice notice--plain">
            No photos uploaded yet - add them from the admin page and they will appear here. 📷
          </div>
        </section>
      ) : (
        loaderData.groups.map((ev, i) => (
          <section
            className={`section gallery-group${i === loaderData.groups.length - 1 ? " section--last" : ""}`}
            key={ev.slug}
          >
            <div className="gallery-group__head">
              <h2>{ev.subtitle ? `${ev.name} - ${ev.subtitle}` : ev.title}</h2>
              <span className="eyebrow">{ev.monthLabel || ev.dateLabel}</span>
            </div>
            <PhotoGrid photos={ev.photos} />
            {ev.drive ? (
              <div className="btn-row" style={{ marginTop: 16 }}>
                <DriveLink href={ev.drive} label="Event photo drive" />
              </div>
            ) : null}
          </section>
        ))
      )}
    </main>
  );
}
