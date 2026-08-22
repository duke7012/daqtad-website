import { safeHref } from "~/lib/urls";
import type { Social } from "~/types";

export function Footer({ social }: { social: Social }) {
  const instagram = safeHref(social.instagram) || "https://instagram.com/daqtad";
  const facebook = safeHref(social.facebook) || "https://fb.com/daqtad";
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span>Made by DA'QTAD Duke with love ❤️</span>
      <span className="site-footer__links">
        <a
          className="icon-link"
          href={instagram}
          target="_blank"
          rel="noopener"
          title="Instagram"
          aria-label="DA'QTAD on Instagram"
        >
          <span className="icon icon--instagram" aria-hidden="true"></span>
        </a>
        <a
          className="icon-link"
          href={facebook}
          target="_blank"
          rel="noopener"
          title="Facebook"
          aria-label="DA'QTAD on Facebook"
        >
          <span className="icon icon--facebook" aria-hidden="true"></span>
        </a>
        <span>© <span>{year}</span></span>
      </span>
    </footer>
  );
}
