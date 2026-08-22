import { Media } from "~/components/Media";
import { loadSite } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
import { safeHref } from "~/lib/urls";
import type { Route } from "./+types/about";

export async function loader() {
  const site = await loadSite();
  return { faqs: site.faqs, social: site.social };
}

export function meta() {
  return pageMeta({
    title: "About — DA'QTAD Kfans District",
    description:
      "DA'QTAD started as K-pop friends in Bến Tre, Vietnam and now throws free random play dance events in Salt Lake City. No skill requirement, no sign-up.",
    path: "/about",
  });
}

export default function About({ loaderData }: Route.ComponentProps) {
  const instagram = safeHref(loaderData.social.instagram) || "https://instagram.com/daqtad";
  const facebook = safeHref(loaderData.social.facebook) || "https://fb.com/daqtad";

  return (
    <main id="main">
      <section className="section section--narrow">
        <div className="about-intro">
          <div className="about-intro__text">
            <h1 className="h1">About us 💜</h1>
            <p>
              <strong>DA'QTAD — Kfans District</strong> started as a group of K-pop friends in Bến Tre, Vietnam, throwing
              random play dances by the riverside. Now we're based in Salt Lake City, Utah, and we kept the tradition
              going — free, outdoor, everyone welcome.
            </p>
            <p>No skill requirement, no sign-up. If you know the dance, jump in. If you don't, cheer loud. That's the whole rule book.</p>
          </div>
          <div className="about-intro__photo">
            <Media src="/assets/images/about-group.jpg" alt="The DA'QTAD crew after a random play dance event" placeholder="Group photo" />
          </div>
        </div>
      </section>

      <section className="section section--narrow">
        <h2 className="h2">Where we host 🌏</h2>
        <div className="map-frame">
          <iframe
            src="/world-map"
            title="Map showing DA'QTAD event locations in Bến Tre, Vietnam and Salt Lake City, Utah"
            loading="lazy"
          />
        </div>
      </section>

      <section className="section section--narrow section--last">
        <h2 className="h2">FAQ</h2>
        <div className="faq">
          {loaderData.faqs.map((faq) => (
            <details key={faq.q}>
              <summary>{faq.q}</summary>
              <p>{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="btn-row btn-row--spaced">
          <a className="btn btn--primary btn--sm btn--icon" href={instagram} target="_blank" rel="noopener">
            <span className="icon icon--instagram" aria-hidden="true"></span>
            Follow @daqtad
          </a>
          <a className="btn btn--outline btn--sm btn--icon" href={facebook} target="_blank" rel="noopener">
            <span className="icon icon--facebook" aria-hidden="true"></span>
            fb.com/daqtad
          </a>
        </div>
      </section>
    </main>
  );
}
