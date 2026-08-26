import { redirect } from "react-router";
import type { ReactNode } from "react";
import { Countdown } from "~/components/Countdown";
import { EventHeroButtons } from "~/components/EventHeroButtons";
import { InstagramEmbeds } from "~/components/InstagramEmbeds";
import { Media } from "~/components/Media";
import { PhotoGrid } from "~/components/PhotoGrid";
import { SetlistViewer } from "~/components/SetlistViewer";
import { SongRequestPanel } from "~/components/SongRequestPanel";
import { VideoStack } from "~/components/VideoStack";
import type { EventSectionId } from "~/lib/event-sections";
import { getEvent, loadSite } from "~/lib/content.server";
import { resolveInstagramPhotos } from "~/lib/instagram.server";
import type { InstagramPhoto } from "~/lib/instagram.server";
import { pageMeta } from "~/lib/meta";
import { handleSongRequest } from "~/lib/request-action.server";
import { listRequests } from "~/lib/requests.server";
import { absolute, eventHref, isCustomEventPage } from "~/lib/urls";
import type { EventItem, SongRequest } from "~/types";
import type { Route } from "./+types/events-slug";

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug || "";
  const site = await loadSite();
  const event = getEvent(site, slug);
  if (event && isCustomEventPage(event.page)) {
    throw redirect(eventHref(event));
  }
  const requests = event?.id ? await listRequests(event.id) : [];
  const instagramPhotos = event?.instagramPosts ? await resolveInstagramPhotos(event.instagramPosts) : [];
  return { slug, event: event ?? null, requests, social: site.social, instagramPhotos };
}

export async function action({ request, params }: Route.ActionArgs) {
  const site = await loadSite();
  const event = getEvent(site, params.slug || "");
  if (!event) return { message: "Event not found.", failed: true };
  return handleSongRequest(await request.formData(), event);
}

export function meta({ data }: Route.MetaArgs) {
  const event = data?.event;
  if (!event) {
    return pageMeta({
      title: "Event not found · DA'QTAD",
      description: "That event could not be found.",
      path: "/events",
      type: "article",
    });
  }
  return pageMeta({
    title: `${event.title} · DA'QTAD`,
    description: "Photos, recap video and the full setlist from a DA'QTAD random play dance event in Salt Lake City.",
    path: eventHref(event),
    image: absolute(event.poster || event.cover) || undefined,
    type: "article",
  });
}

function EventHead({ event, social }: { event: EventItem; social: { instagram: string; facebook: string } }) {
  const upcoming = event.status === "upcoming";
  const when = [event.dateLabel, event.timeLabel].filter(Boolean).join(" · ");

  return (
    <div className="event-hero__body">
      <span className={`tag ${upcoming ? "tag--live" : "tag--past"}`}>
        {upcoming ? event.badge || "Upcoming" : `Past event · ${event.dateLabel}`}
      </span>
      <h1 className="event-hero__title">
        {event.name}
        {event.subtitle ? (
          <>
            <br />
            <span>{event.subtitle}</span>
          </>
        ) : null}
      </h1>
      <p className="event-facts">
        {when ? <>📅 {when}</> : null}
        {when && event.venue ? <br /> : null}
        {event.venue ? <>📍 {event.venue}</> : null}
        {(when || event.venue) && event.stats ? <br /> : null}
        {event.stats ? <>💃 {event.stats}</> : null}
      </p>
      {upcoming && event.startsAt ? (
        <Countdown target={event.startsAt} modifier="countdown--light" />
      ) : null}
      <EventHeroButtons event={event} social={social} />
    </div>
  );
}

function eventSectionContent(
  id: EventSectionId,
  event: EventItem,
  requests: SongRequest[],
  social: { instagram: string; facebook: string },
  instagramPhotos: InstagramPhoto[],
): ReactNode | null {
  const hasPhotos = !!(event.photos && event.photos.length);
  const hasSetlist = !!(event.rounds && event.rounds.length);

  switch (id) {
    case "requests":
      return (
        <SongRequestPanel
          event={event}
          requests={requests}
          note="Want your bias's song in the playlist? Drop it here - we pick the most-requested ones."
        />
      );
    case "instagram":
      return (
        <>
          <h2 className="h2">From Instagram 📸</h2>
          <InstagramEmbeds items={instagramPhotos} profile={social.instagram} />
        </>
      );
    case "videos":
      return (
        <>
          <h2 className="h2">Videos 🎬</h2>
          <VideoStack video={event.video} title={event.title} />
        </>
      );
    case "photos":
      if (!hasPhotos) return null;
      return (
        <>
          <h2 className="h2">Photos 📸</h2>
          <PhotoGrid photos={event.photos} placeholder={`${event.name} photo`} large />
        </>
      );
    case "setlists":
      if (!hasSetlist) return null;
      return (
        <>
          <h2 className="h2">Setlists 🎵</h2>
          <p className="lede lede--tight">
            Every song from each round, in order. Use the search box to check whether a track was played.
          </p>
          <SetlistViewer event={event} mode="full" />
        </>
      );
    default:
      return null;
  }
}

export default function EventDetail({ loaderData }: Route.ComponentProps) {
  const { event, slug, requests, social, instagramPhotos } = loaderData;

  if (!event) {
    return (
      <main id="main">
        <section className="section section--narrow">
          <a className="link-strong" href="/events">
            ← All events
          </a>
          <h1 className="event-hero__title">Event not found</h1>
          <p className="lede">
            There is no event called “{slug}”. It may have been renamed or removed.
          </p>
          <div className="btn-row">
            <a className="btn btn--primary" href="/events">
              See all events
            </a>
          </div>
        </section>
      </main>
    );
  }

  const upcoming = event.status === "upcoming";
  const sections = event.pageSections
    .filter((section) => section.visible)
    .map((section) => ({
      id: section.id,
      content: eventSectionContent(section.id, event, requests, social, instagramPhotos),
    }))
    .filter((section) => section.content);

  return (
    <main id="main">
      <section className="section section--narrow">
        <a className="link-strong" href="/events">
          ← All events
        </a>
        <div className="event-hero">
          <div className="event-hero__poster">
            <Media
              src={event.poster}
              alt={event.posterAlt}
              placeholder={`${event.name} event poster (4:5)`}
              modifier={upcoming ? "media--dark" : ""}
            />
          </div>
          <EventHead event={event} social={social} />
        </div>
      </section>

      {sections.map((section, index) => (
        <section
          className={`section section--narrow${index === sections.length - 1 ? " section--last" : ""}`}
          key={section.id}
        >
          {section.content}
        </section>
      ))}
    </main>
  );
}
