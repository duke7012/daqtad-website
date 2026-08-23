import { instagramEmbedUrls, safeHref } from "~/lib/urls";

export function InstagramEmbeds({
  posts,
  profile,
}: {
  posts: string;
  profile?: string;
}) {
  const embeds = instagramEmbedUrls(posts);
  const href = safeHref(profile);

  if (!embeds.length) {
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
      {embeds.map((src) => (
        <div className="ig-frame" key={src}>
          <iframe
            src={src}
            title="Instagram post"
            loading="lazy"
            allow="encrypted-media; clipboard-write"
            allowFullScreen
          />
        </div>
      ))}
    </div>
  );
}
