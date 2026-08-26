import { Media } from "~/components/Media";
import { pageMeta } from "~/lib/meta";

const projects = [
  {
    id: "charity",
    title: "Charity Visit — Chùa Phật Minh",
    eyebrow: "Volunteer · Bến Tre",
    image: "/assets/images/extras/charity-chua-phat-minh.jpg",
    placeholder: "Charity visit photo",
    alt: "DA'QTAD and local K-pop fans at Chùa Phật Minh during a charity visit",
    body: (
      <p>
        We organized a charity visit to <strong>Chùa Phật Minh (Từ Tâm)</strong> in Bến Tre, where DA'QTAD and local
        K-pop fans donated gifts to orphaned children.
      </p>
    ),
  },
  {
    id: "100-project",
    title: "The 100 Project",
    eyebrow: "International flashmob · COVID-19",
    image: "/assets/images/extras/the-100-project.jpg",
    placeholder: "The 100 Project photo",
    alt: "Dancers from The 100 Project international flashmob inspired by Ghen Cô-Vy",
    body: (
      <>
        <p>
          During the COVID-19 pandemic, we launched <strong>The 100 Project</strong>, an international online flashmob
          inspired by the Vietnamese song <strong>&ldquo;Ghen Cô-Vy.&rdquo;</strong> The project was created to spread
          positivity and encourage people to protect themselves during the pandemic.
        </p>
        <p>
          Although our original goal was to bring together 100 dancers, the final project connected{" "}
          <strong>30 dancers from 6 different countries</strong>.
        </p>
      </>
    ),
  },
  {
    id: "radionair",
    title: "radiONair",
    eyebrow: "Online radio series",
    image: "/assets/images/extras/radionair.jpg",
    placeholder: "radiONair session photo",
    alt: "DA'QTAD radiONair online radio series session",
    body: (
      <p>
        We also created <strong>radiONair</strong>, our online radio series where K-pop fans could join us to talk about
        music, request their favorite songs, and participate in interactive K-pop games while everyone was staying
        connected from home.
      </p>
    ),
  },
] as const;

export function meta() {
  return pageMeta({
    title: "Extras — DA'QTAD Kfans District",
    description:
      "Beyond Random Play Dance: DA'QTAD charity work, The 100 Project flashmob, and radiONair — community projects from Bến Tre and beyond.",
    path: "/extras",
  });
}

export default function Extras() {
  return (
    <main id="main">
      <section className="section section--narrow">
        <h1 className="h1">Extras</h1>
        <p className="lede">
          DA'QTAD has never been only about dancing. These are the community projects we built beyond Random Play Dance
          — volunteering, creative campaigns, and ways to stay connected when we couldn&apos;t gather in person.
        </p>
      </section>

      {projects.map((project, index) => (
        <section
          key={project.id}
          id={project.id}
          className={`section section--narrow${index === projects.length - 1 ? " section--last" : ""}`}
        >
          <article className={`extras-feature${index % 2 === 1 ? " extras-feature--flip" : ""}`}>
            <div className="extras-feature__media">
              <Media src={project.image} alt={project.alt} placeholder={project.placeholder} />
            </div>
            <div className="extras-feature__text">
              <span className="eyebrow">{project.eyebrow}</span>
              <h2 className="h2">{project.title}</h2>
              <div className="about-story">{project.body}</div>
            </div>
          </article>
        </section>
      ))}
    </main>
  );
}
