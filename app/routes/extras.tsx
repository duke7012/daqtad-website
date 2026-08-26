import { PhotoGrid } from "~/components/PhotoGrid";
import { RichText } from "~/components/RichText";
import { VideoStack } from "~/components/VideoStack";
import { loadExtrasPage } from "~/lib/content.server";
import { splitParagraphs } from "~/lib/pages";
import { pageMeta } from "~/lib/meta";
import { youtubeIds } from "~/lib/urls";
import type { Route } from "./+types/extras";

export async function loader() {
  return { extras: await loadExtrasPage() };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const title = loaderData?.extras?.title || "Extras";
  return pageMeta({
    title: `${title} - DA'QTAD Kfans District`,
    description:
      "Beyond Random Play Dance: DA'QTAD charity work, The 100 Project flashmob, and radiONair - community projects from Bến Tre and beyond.",
    path: "/extras",
  });
}

export default function Extras({ loaderData }: Route.ComponentProps) {
  const { extras } = loaderData;

  return (
    <main id="main">
      <section className="section">
        <h1 className="h1">{extras.title}</h1>
        {splitParagraphs(extras.intro).map((paragraph, i) => (
          <p className="lede" key={i} style={i > 0 ? { marginTop: 12 } : undefined}>
            {paragraph}
          </p>
        ))}
        {extras.projects.length ? (
          <nav className="extras-toc" aria-label="Extras projects">
            {extras.projects.map((project) => (
              <a key={project.id} href={`#${project.slug || project.id}`}>
                {project.title}
              </a>
            ))}
          </nav>
        ) : null}
      </section>

      {extras.projects.map((project, index) => {
        const photos = project.photos || [];
        const hasVideos = youtubeIds(project.videos).length > 0;
        const last = index === extras.projects.length - 1;
        const anchor = project.slug || project.id;

        return (
          <article
            key={project.id}
            id={anchor}
            className={`section extras-article${last ? " section--last" : ""}`}
          >
            <header className="extras-article__head">
              {project.eyebrow ? <span className="eyebrow">{project.eyebrow}</span> : null}
              <h2 className="h1 extras-article__title">{project.title}</h2>
              <div className="about-story">
                {splitParagraphs(project.body).map((paragraph, i) => (
                  <RichText key={i} text={paragraph} />
                ))}
              </div>
            </header>

            {photos.length ? (
              <div className="extras-article__block">
                <h3 className="h3">Photos</h3>
                <PhotoGrid photos={photos} placeholder={`${project.title} photo`} large />
              </div>
            ) : null}

            {hasVideos ? (
              <div className="extras-article__block">
                <h3 className="h3">Videos</h3>
                <VideoStack video={project.videos} title={project.title} showEmpty={false} />
              </div>
            ) : null}
          </article>
        );
      })}
    </main>
  );
}
