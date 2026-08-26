import { SITE_ORIGIN } from "~/lib/urls";

export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  robots?: string;
}) {
  const url = `${SITE_ORIGIN}${opts.path}`;
  const image = opts.image || `${SITE_ORIGIN}/assets/images/og-cover.jpg`;
  const tags: Array<
    | { title: string }
    | { name: string; content: string }
    | { property: string; content: string }
    | { tagName: "link"; rel: string; href: string }
  > = [
    { title: opts.title },
    { name: "description", content: opts.description },
    { name: "theme-color", content: "#f6f5fc" },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:site_name", content: "DA'QTAD - Kfans District" },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { name: "twitter:card", content: "summary_large_image" },
    { tagName: "link", rel: "canonical", href: url },
  ];
  if (opts.robots) tags.push({ name: "robots", content: opts.robots });
  return tags;
}

export function canonical(path: string) {
  return [{ rel: "canonical" as const, href: `${SITE_ORIGIN}${path}` }];
}
