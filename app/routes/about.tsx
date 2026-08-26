import { Link } from "react-router";
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
      "DA'QTAD /duh-kah-taht/ is a K-pop community founded in Bến Tre, Vietnam in 2019. Now in Salt Lake City, we bring fans together through Random Play Dance.",
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
            <h1 className="h1">About DA'QTAD</h1>
            <p>
              <strong>DA'QTAD</strong>{" "}
              <span className="about-pronounce" aria-label="pronounced duh-kah-taht">
                /duh-kah-taht/
              </span>{" "}
              is a K-pop community originally founded in <strong>Bến Tre City, Vietnam, in 2019</strong> by a group of
              high school friends: (Tâm) Đan, (Trúc) An, (Thúy) Quyên, (Phan) Thông, (Trúc) Anh, and Duke.
            </p>
            <p>
              What started as a shared love for K-pop quickly became something bigger. We wanted to bring K-pop events
              closer to our local community, especially <strong>K-pop Random Play Dance</strong>, or RPD, where fans
              gather, recognize songs as they play, jump onto the dance floor, and perform the choreography together.
            </p>
          </div>
          <div className="about-intro__photo">
            <Media
              src="/assets/images/about-group.jpg"
              alt="The DA'QTAD crew after a random play dance event"
              placeholder="Group photo"
            />
          </div>
        </div>
      </section>

      <section className="section section--narrow">
        <article className="about-story">
          <h2 className="h2">Our Beginning in Vietnam</h2>
          <p>
            Since 2019, DA'QTAD has organized <strong>6 official Random Play Dance events in Bến Tre</strong>, welcoming
            more than <strong>1,000 participants</strong> in total. We also expanded beyond our main events with special
            spin-offs, including an RPD held during a university military bootcamp in collaboration with IEF and an
            online livestreamed RPD during the COVID-19 period.
          </p>
          <p>
            For us, DA'QTAD has never been only about dancing. It has always been about creating a place where K-pop
            fans can meet, connect, have fun, and feel part of a community.
          </p>
        </article>
      </section>

      <section className="section section--narrow">
        <article className="about-story">
          <h2 className="h2">More Than Random Play Dance</h2>
          <p>
            During our time in Vietnam, we also used our community to create meaningful projects beyond K-pop events —
            charity work, an international flashmob, and an online radio series.
          </p>
          <p>
            <Link className="link-strong" to="/extras">
              Explore Extras →
            </Link>
          </p>
        </article>
      </section>

      <section className="section section--narrow">
        <article className="about-story">
          <h2 className="h2">A New Chapter</h2>
          <p>
            After COVID-19, the original DA'QTAD members gradually began pursuing different paths around the world. Đan
            moved to Australia for higher education, An continued her studies in Japan, Quyên and Thông began focusing
            on their careers, and Duke moved to the United States for university.
          </p>
          <p>But the DA'QTAD story did not end there.</p>
          <p>
            After moving to Salt Lake City, Duke decided to continue the tradition of bringing K-pop fans together and
            introduced DA'QTAD to the Utah community.
          </p>
          <p>
            Together with <strong>Hanni, Phoebe, Vy, and Dinh</strong>, he formed <strong>DA'QTAD USA</strong>,
            affectionately giving the name a new meaning: <strong>The (da) Cutie (qt) Admins (ad).</strong>
          </p>
        </article>
      </section>

      <section className="section section--narrow">
        <article className="about-story">
          <h2 className="h2">DA'QTAD USA</h2>
          <p>
            In <strong>2025 and 2026</strong>, DA'QTAD USA organized{" "}
            <strong>two large-scale K-pop Random Play Dance events in Utah</strong>, welcoming more than{" "}
            <strong>200 attendees combined</strong>.
          </p>
          <p>
            Our Salt Lake City events have continued the same spirit that started in Bến Tre years ago: an open dance
            floor, a carefully curated playlist, lots of energy, and a welcoming space where everyone can celebrate
            K-pop together.
          </p>
          <p>
            Now, DA'QTAD USA is beginning to expand beyond our own independent events through collaborations, festivals,
            pop-ups, and conventions. Our participation with <strong>Bopsim</strong> marks our first pop-up event
            outside of Vietnam and another exciting step in bringing the DA'QTAD experience to new communities.
          </p>
        </article>
      </section>

      <section className="section section--narrow">
        <article className="about-story about-story--closing">
          <h2 className="h2">What DA'QTAD Means to Us</h2>
          <p>
            DA'QTAD began with six high school friends who simply wanted more K-pop activities in their hometown. Years
            later, that same idea continues across countries and communities.
          </p>
          <p>
            Whether we are organizing a Random Play Dance, creating an online project, volunteering, collaborating with
            other organizations, or simply giving fans a place to dance together, our goal remains the same:
          </p>
          <p className="about-mission">
            Bring people together through K-pop, create unforgettable memories, and keep the Random Play Dance energy
            alive wherever we go.
          </p>
          <p className="about-closing">
            From <strong>Bến Tre to Salt Lake City</strong>, this is DA'QTAD.
          </p>
        </article>
      </section>

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
