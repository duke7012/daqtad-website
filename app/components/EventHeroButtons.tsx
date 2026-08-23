import { eventHeroButtons } from "~/lib/event-hero-links";
import type { EventItem, Social } from "~/types";

const ICON_CLASS = {
  instagram: "icon--instagram",
  facebook: "icon--facebook",
  youtube: "icon--youtube",
  drive: "icon--drive",
} as const;

export function EventHeroButtons({ event, social }: { event: EventItem; social: Social }) {
  const buttons = eventHeroButtons(event, social);
  if (!buttons.length) return null;

  return (
    <div className="btn-row">
      {buttons.map((button) => (
        <a
          key={button.kind}
          className="btn btn--outline btn--sm btn--icon"
          href={button.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={`icon ${ICON_CLASS[button.kind]}`} aria-hidden="true"></span>
          {button.label}
        </a>
      ))}
    </div>
  );
}
