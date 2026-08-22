import { EventRow } from "~/components/EventCards";
import { loadSite } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
import type { Route } from "./+types/events";

export async function loader() {
  const site = await loadSite();
  return { events: site.events };
}

export function meta() {
  return pageMeta({
    title: "All events — DA'QTAD Kfans District",
    description: "Every DA'QTAD K-pop random play dance so far, newest first. Photos, videos and full setlists for each event.",
    path: "/events",
  });
}

export default function Events({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main">
      <section className="section">
        <h1 className="h1">All events</h1>
        <p className="lede">
          Every DA'QTAD random play dance so far — newest first. Tap one for photos, videos and the full setlist.
        </p>
      </section>
      <section className="section section--last">
        <div className="event-list">
          {loaderData.events.map((event) => (
            <EventRow key={event.slug} event={event} />
          ))}
        </div>
      </section>
    </main>
  );
}
