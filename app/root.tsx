import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import stylesheet from "~/styles/styles.css?url";
import adminStyles from "~/styles/admin.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/assets/favicon.svg", type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;700;900&family=Manrope:wght@400;500;600;700;800&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: adminStyles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let detail = "Please try again in a moment.";

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "This page ran back to the crowd 💨" : `${error.status} ${error.statusText}`;
    detail =
      error.status === 404
        ? "The song ended before we could find it. Try one of these instead:"
        : error.status === 413
          ? "That upload is too large. Photos must be under 4 MB each — pick fewer or smaller files."
          : error.data || detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <main className="center-stage" style={{ padding: "80px 24px" }}>
      <span className="eyebrow">{isRouteErrorResponse(error) ? error.status : "Error"}</span>
      <h1 className="h1">{title}</h1>
      <p className="lede">{detail}</p>
      <div className="btn-row">
        <a className="btn btn--primary" href="/">
          Home
        </a>
        <a className="btn btn--outline" href="/events">
          All events
        </a>
      </div>
    </main>
  );
}
