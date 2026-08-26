import { Link } from "react-router";
import { PhotoGrid } from "~/components/PhotoGrid";
import { RichText } from "~/components/RichText";
import { VideoStack } from "~/components/VideoStack";
import { loadAboutPage, loadSite } from "~/lib/content.server";
import { splitParagraphs } from "~/lib/pages";
import { pageMeta } from "~/lib/meta";
import { safeHref, youtubeIds } from "~/lib/urls";
import type { Route } from "./+types/about";

export async function loader() {
  const [site, about] = await Promise.all([loadSite(), loadAboutPage()]);
  return { faqs: site.faqs, social: site.social, about };
}

export function meta() {
  return pageMeta({
    title: "About - DA'QTAD Kfans District",
    description:
      "DA'QTAD /duh-kah-taht/ is a K-pop community founded in Bến Tre, Vietnam in 2019. Now in Salt Lake City, we bring fans together through Random Play Dance.",
    path: "/about",
  });
}

export default function About({ loaderData }: Route.ComponentProps) {
  const { about, faqs, social } = loaderData;
  const instagram = safeHref(social.instagram) || "https://instagram.com/daqtad";
  const facebook = safeHref(social.facebook) || "https://fb.com/daqtad";

  return (
    <main id="main">
      <section className="section section--narrow">
        <h1 className="h1">{about.title}</h1>
        {about.pronunciation ? (
          <p className="about-pronounce-line" aria-label={`pronounced ${about.pronunciation.replace(/\//g, "")}`}>
            {about.pronunciation}
          </p>
        ) : null}
        <div className="about-story">
          {splitParagraphs(about.intro).map((paragraph, i) => (
            <RichText key={i} text={paragraph} />
          ))}
        </div>
      </section>

      {about.sections.map((section) => {
        const photos = section.photos || [];
        const hasVideos = youtubeIds(section.videos).length > 0;
        return (
          <section className="section" key={section.id}>
            <article className={`about-story${section.mission || section.closing ? " about-story--closing" : ""}`}>
              {section.heading ? <h2 className="h2">{section.heading}</h2> : null}
              {splitParagraphs(section.body).map((paragraph, i) => (
                <RichText key={i} text={paragraph} />
              ))}
              {section.mission ? <p className="about-mission">{section.mission}</p> : null}
              {section.closing ? <RichText text={section.closing} className="about-closing" /> : null}
              {section.linkLabel && section.linkHref ? (
                <p>
                  {section.linkHref.startsWith("/") ? (
                    <Link className="link-strong" to={section.linkHref}>
                      {section.linkLabel}
                    </Link>
                  ) : (
                    <a className="link-strong" href={section.linkHref} target="_blank" rel="noopener">
                      {section.linkLabel}
                    </a>
                  )}
                </p>
              ) : null}
            </article>

            {photos.length ? (
              <div className="about-section-media">
                <PhotoGrid photos={photos} placeholder={`${section.heading || "About"} photo`} large />
              </div>
            ) : null}

            {hasVideos ? (
              <div className="about-section-media">
                <VideoStack video={section.videos} title={section.heading || about.title} showEmpty={false} />
              </div>
            ) : null}
          </section>
        );
      })}

      <section className="section section--narrow">
        <h2 className="h2">Where we host</h2>
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
          {faqs.map((faq) => (
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
