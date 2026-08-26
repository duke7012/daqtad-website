import { data } from "react-router";
import { pageMeta } from "~/lib/meta";

export function loader() {
  return data(null, { status: 404 });
}

export function meta() {
  return [
    ...pageMeta({
      title: "Page not found - DA'QTAD",
      description: "This page could not be found.",
      path: "/",
      robots: "noindex",
    }),
  ];
}

export default function NotFound() {
  return (
    <main className="center-stage" id="main">
      <span className="eyebrow">404</span>
      <h1 className="h1">This page ran back to the crowd 💨</h1>
      <p className="lede">The song ended before we could find it. Try one of these instead:</p>
      <div className="btn-row">
        <a className="btn btn--primary" href="/">
          Home
        </a>
        <a className="btn btn--outline" href="/events">
          All events
        </a>
        <a className="btn btn--outline" href="/gallery">
          Gallery
        </a>
      </div>
    </main>
  );
}
