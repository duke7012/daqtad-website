import { Outlet, useLoaderData } from "react-router";
import { Footer } from "~/components/Footer";
import { Header } from "~/components/Header";
import { loadSite } from "~/lib/content.server";
import type { Social } from "~/types";

export async function loader() {
  const site = await loadSite();
  return { social: site.social };
}

export default function PublicLayout() {
  const { social } = useLoaderData<{ social: Social }>();

  return (
    <div className="page">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <Outlet context={{ social }} />
      <Footer social={social} />
    </div>
  );
}
