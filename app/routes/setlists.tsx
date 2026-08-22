import { SetlistViewer } from "~/components/SetlistViewer";
import { loadSite, pastEvents } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
import { totalSongs } from "~/lib/urls";
import type { Route } from "./+types/setlists";

export async function loader() {
  const site = await loadSite();
  return {
    events: pastEvents(site).filter((ev) => ev.rounds && ev.rounds.length),
  };
}

export function meta() {
  return pageMeta({
    title: "Setlists — DA'QTAD Kfans District",
    description: "Every round of every DA'QTAD K-pop random play dance, song by song.",
    path: "/setlists",
  });
}

export default function Setlists({ loaderData }: Route.ComponentProps) {
  return (
    <main id="main">
      <section className="section">
        <h1 className="h1">Setlists</h1>
        <p className="lede">
          Every round of every event, usually around 100 songs each. Pick a round to preview it, then expand for the full
          list.
        </p>
      </section>
      <section className="section section--last">
        {loaderData.events.map((ev) => (
          <article className="setlist-card" key={ev.slug}>
            <div className="setlist-card__head">
              <h2>{ev.subtitle ? `${ev.name} — ${ev.subtitle}` : ev.title}</h2>
              <span className="setlist-card__meta">
                {ev.monthLabel || ev.dateLabel} · {ev.rounds.length} rounds · {totalSongs(ev)} songs
              </span>
            </div>
            <SetlistViewer event={ev} mode="preview" />
          </article>
        ))}
      </section>
    </main>
  );
}
