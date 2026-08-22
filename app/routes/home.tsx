import { EventCard, NextEventCard } from "~/components/EventCards";
import { loadSite, pastEvents, upcomingEvent } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
import { safeHref } from "~/lib/urls";
import type { Route } from "./+types/home";

export async function loader() {
  const site = await loadSite();
  return {
    next: upcomingEvent(site) ?? null,
    recent: pastEvents(site).slice(0, 3),
    social: site.social,
  };
}

export function meta() {
  return pageMeta({
    title: "DA'QTAD — K-pop Random Play Dance in Salt Lake City",
    description:
      "DA'QTAD (Kfans District) throws free K-pop random play dance events in Salt Lake City. Browse past RPDs, photos, setlists, and request songs for the next one.",
    path: "/",
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { next, recent, social } = loaderData;
  const instagram = safeHref(social.instagram) || "https://instagram.com/daqtad";
  const facebook = safeHref(social.facebook) || "https://fb.com/daqtad";

  return (
    <main id="main">
      <section className="section section--flush">
        <div className="hero">
          <div className="hero-media">
            <div className="media media--dark media--quiet" data-placeholder="DA'QTAD random play dance">
              <video
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/assets/images/hero.jpg"
                aria-hidden="true"
              >
                <source src="/assets/images/homepage_background.mp4" type="video/mp4" />
              </video>
              <img
                className="hero-poster"
                src="/assets/images/hero.jpg"
                alt="Collage of DA'QTAD community gatherings and K-pop fan events"
                decoding="async"
              />
            </div>
          </div>
          <div className="hero-scrim"></div>
          <div className="hero-body">
            <div className="btn-row">
              <span className="tag tag--outline-violet">K-pop Random Play Dance</span>
            </div>
            <h1 className="hero-title">
              DA'QTAD
              <br />
              <span className="accent-violet">Kfans</span> <span className="accent-rose">District</span>
            </h1>
            <p className="hero-text">
              We throw K-pop random play dance events — and this is our little archive. Relive past RPDs, browse photos
              and setlists, and request songs for the next one. 💜
            </p>
            <div className="btn-row">
              <a className="btn btn--primary" href="/events/popup">
                Next event ↗
              </a>
              <a
                className="icon-link icon-link--light"
                href={instagram}
                target="_blank"
                rel="noopener"
                title="Instagram"
                aria-label="Follow DA'QTAD on Instagram"
              >
                <span className="icon icon--instagram" aria-hidden="true"></span>
              </a>
              <a
                className="icon-link icon-link--light"
                href={facebook}
                target="_blank"
                rel="noopener"
                title="Facebook"
                aria-label="Follow DA'QTAD on Facebook"
              >
                <span className="icon icon--facebook" aria-hidden="true"></span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {next ? (
        <section className="section section--flush">
          <NextEventCard event={next} />
        </section>
      ) : null}

      <section className="section section--last">
        <div className="section-head">
          <h2 className="h2">Recent events</h2>
          <a className="link-strong" href="/events">
            All events →
          </a>
        </div>
        <div className="card-grid">
          {recent.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      </section>
    </main>
  );
}
