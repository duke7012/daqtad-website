import { Countdown } from "~/components/Countdown";
import { EventHeroButtons } from "~/components/EventHeroButtons";
import { Media } from "~/components/Media";
import { SongRequestPanel } from "~/components/SongRequestPanel";
import { VideoStack } from "~/components/VideoStack";
import { getEvent, loadSite } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
import { handleSongRequest } from "~/lib/request-action.server";
import { listRequests } from "~/lib/requests.server";
import { SITE_ORIGIN } from "~/lib/urls";
import type { Route } from "./+types/events-popup";

export async function loader() {
  const site = await loadSite();
  const event = getEvent(site, "popup");
  const requests = event?.id ? await listRequests(event.id) : [];
  return { event: event ?? null, requests, social: site.social };
}

export async function action({ request }: Route.ActionArgs) {
  const site = await loadSite();
  const event = getEvent(site, "popup");
  if (!event) return { message: "Event not found.", failed: true };
  return handleSongRequest(await request.formData(), event);
}

export function meta() {
  return pageMeta({
    title: "Spin-Off (Pop-Up) - Bopsim Korean Festival · DA'QTAD",
    description:
      "DA'QTAD Spin-Off (Pop-Up) at the Bopsim Korean Festival. Friday, Sep 11 2026, University of Utah, Salt Lake City. Free entry, and song requests are open.",
    path: "/events/popup",
    image: `${SITE_ORIGIN}/assets/images/events/popup-poster.jpg`,
    type: "article",
  });
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "DA'QTAD Spin-Off (Pop-Up) - Bopsim Korean Festival",
  startDate: "2026-09-11T16:00:00-06:00",
  endDate: "2026-09-11T21:00:00-06:00",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  location: {
    "@type": "Place",
    name: "Bopsim Korean Festival, University of Utah",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Salt Lake City",
      addressRegion: "UT",
      addressCountry: "US",
    },
  },
  organizer: { "@type": "Organization", name: "DA'QTAD - Kfans District" },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://daqtad.org/events/popup",
  },
};

export default function EventPopup({ loaderData }: Route.ComponentProps) {
  const { event, requests, social } = loaderData;

  return (
    <main id="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="section section--narrow">
        <a className="link-strong" href="/events">
          ← All events
        </a>
        <div className="event-hero">
          <div className="event-hero__poster">
            <Media
              src={event?.poster}
              alt={event?.posterAlt || "Spin-Off (Pop-Up) event poster"}
              placeholder="Spin-Off event poster (4:5)"
              modifier="media--dark"
            />
          </div>
          <div className="event-hero__body">
            <span className="tag tag--live">Upcoming event</span>
            <h1 className="event-hero__title">
              Spin-Off (Pop-Up)
              <br />
              <span>Bopsim Korean Festival</span>
            </h1>
            <p className="event-facts">
              📅 Friday, Sep 11 2026 · 4:00–9:00 PM
              <br />
              📍 Bopsim Korean Festival, University of Utah, Salt Lake City, UT
              <br />
              🎟 Free - just show up and dance!
            </p>
            <Countdown target={event?.startsAt || "2026-09-11T16:00:00-06:00"} modifier="countdown--light" />
            {event ? <EventHeroButtons event={event} social={social} /> : null}
          </div>
        </div>
      </section>

      {event ? (
        <section className="section section--narrow">
          <h2 className="h2">Videos 🎬</h2>
          <VideoStack video={event.video} title={event.title} />
        </section>
      ) : null}

      {event ? (
        <section className="section section--narrow section--last">
          <SongRequestPanel
            event={event}
            requests={requests}
            note="Want your bias's song in the Pop-Up playlist? Drop it here - we pick the most-requested ones."
          />
        </section>
      ) : null}
    </main>
  );
}
