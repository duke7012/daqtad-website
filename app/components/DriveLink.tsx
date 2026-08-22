import { safeHref } from "~/lib/urls";

export function DriveLink({ href, label = "Photo drive" }: { href?: string; label?: string }) {
  const url = safeHref(href);
  if (!url) return null;
  return (
    <a className="btn btn--outline btn--sm btn--icon" href={url} target="_blank" rel="noopener">
      <span className="icon icon--drive" aria-hidden="true"></span>
      {label}
    </a>
  );
}
