import { useState } from "react";
import { safeHref } from "~/lib/urls";
import type { InstagramPhoto } from "~/lib/instagram.server";

function InstagramTile({ item }: { item: InstagramPhoto }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <a
        className="ig-tile ig-tile--fallback"
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="icon icon--instagram" aria-hidden="true"></span>
        <span>{item.caption || "View on Instagram"}</span>
      </a>
    );
  }

  return (
    <a
      className="ig-tile"
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.caption ? `${item.caption} — view on Instagram` : "View on Instagram"}
      title={item.caption || undefined}
    >
      <img
        src={item.src}
        alt={item.alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
      {item.caption ? <span className="ig-tile__caption">{item.caption}</span> : null}
    </a>
  );
}

export function InstagramEmbeds({
  items,
  profile,
}: {
  items: InstagramPhoto[];
  profile?: string;
}) {
  const href = safeHref(profile);

  if (!items.length) {
    return (
      <div className="ig-empty">
        <p>Follow along on Instagram for announcements and updates.</p>
        {href ? (
          <a className="btn btn--outline btn--sm btn--icon" href={href} target="_blank" rel="noopener">
            <span className="icon icon--instagram" aria-hidden="true"></span>
            Instagram
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ig-grid">
      {items.map((item) => (
        <InstagramTile key={item.href} item={item} />
      ))}
    </div>
  );
}
