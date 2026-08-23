import { Countdown } from "~/components/Countdown";
import { Media } from "~/components/Media";
import { eventHref, rooted } from "~/lib/urls";
import type { EventItem } from "~/types";

export function NextEventCard({ event }: { event: EventItem }) {
  const banner = rooted(event.banner);

  return (
    <a className={`next-card${banner ? " next-card--media" : ""}`} href={eventHref(event)}>
      {banner ? (
        <>
          <img className="next-card__bg" src={banner} alt="" aria-hidden="true" decoding="async" />
          <span className="next-card__scrim" aria-hidden="true" />
        </>
      ) : null}
      <div className="next-card__body">
        <span className="eyebrow">★ Up next</span>
        <div className="next-card__title">{event.title}</div>
        <div className="next-card__meta">
          {event.dateLabel} · {event.timeLabel} · {event.venue}
        </div>
        {event.requestsOpen ? (
          <div className="next-card__cta">Song requests are open → tap to request</div>
        ) : null}
      </div>
      {event.startsAt ? <Countdown target={event.startsAt} /> : null}
    </a>
  );
}

export function EventCard({ event }: { event: EventItem }) {
  return (
    <a className="event-card" href={eventHref(event)}>
      <div className="event-card__media">
        <Media src={event.cover} alt={`${event.title} cover photo`} placeholder={`${event.name} cover photo`} />
      </div>
      <div className="event-card__body">
        <span className="eyebrow event-card__date">{event.dateLabel}</span>
        <div className="event-card__title">{event.title}</div>
      </div>
    </a>
  );
}

export function EventRow({ event }: { event: EventItem }) {
  const upcoming = event.status === "upcoming";
  return (
    <a className={`event-row${upcoming ? " event-row--featured" : ""}`} href={eventHref(event)}>
      <div className="event-row__media">
        <Media
          src={event.poster}
          alt={event.posterAlt}
          placeholder={`${event.name} poster`}
          modifier={upcoming ? "media--dark" : ""}
        />
      </div>
      <div className="event-row__body">
        {upcoming ? (
          <span className="tag tag--live">{event.badge || "Upcoming"}</span>
        ) : (
          <span className="tag tag--past">{event.dateLabel}</span>
        )}
        <div className="event-row__title">{event.title}</div>
        <div className="event-row__venue">
          {upcoming ? `${event.dateLabel} · ${event.timeLabel} · ${event.venue}` : event.venue}
        </div>
        <div className="event-row__cta">{event.cta || "View event →"}</div>
      </div>
    </a>
  );
}
