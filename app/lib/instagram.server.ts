import { instagramPostUrls, parseInstagramPost, parseInstagramPostLines, safeHref } from "~/lib/urls";

export interface InstagramPhoto {
  href: string;
  src: string;
  alt: string;
  caption: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const EMBED_UA = "Mozilla/5.0";

const ALLOWED_IMAGE_HOST = /(?:^|\.)(?:cdninstagram\.com|fbcdn\.net)$/i;

function decodeMeta(value: string): string {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\n/g, "\n")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function cleanCaption(raw: string): string {
  let text = decodeMeta(raw).trim();
  text = text.replace(/^"[^"]+" on Instagram:\s*/i, "");
  text = text.replace(/^Instagram photo by [^:]+:\s*/i, "");
  return text.trim();
}

function isAllowedImageUrl(url: string): boolean {
  try {
    return ALLOWED_IMAGE_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function imageFromHtml(html: string): string {
  const patterns = [
    /property="og:image" content="([^"]+)"/,
    /content="([^"]+)" property="og:image"/,
    /"display_url":"([^"]+)"/,
    /"thumbnail_src":"([^"]+)"/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      const src = decodeMeta(match[1]);
      if (isAllowedImageUrl(src)) return src;
    }
  }
  return "";
}

function htmlToText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function captionFromHtml(html: string): string {
  const patterns = [
    /"accessibility_caption":"([^"]+)"/,
    /"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"([^"]+)"/,
    /property="og:description" content="([^"]+)"/,
    /content="([^"]+)" property="og:description"/,
    /property="og:title" content="([^"]+)"/,
    /content="([^"]+)" property="og:title"/,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) {
      const caption = cleanCaption(match[1]);
      if (caption) return caption;
    }
  }
  return "";
}

async function fetchEmbedCaption(postUrl: string): Promise<string> {
  const ref = parseInstagramPost(postUrl);
  if (!ref) return "";

  const embedUrl = `https://www.instagram.com/${ref.kind}/${ref.shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: { "User-Agent": EMBED_UA, Accept: "text/html", Referer: "https://www.instagram.com/" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return "";

  const match = /<div class="Caption"[^>]*>([\s\S]*?)<\/div>/i.exec(await res.text());
  if (!match) return "";

  let text = htmlToText(
    match[1].replace(/<a class="CaptionUsername"[^>]*>[\s\S]*?<\/a>/i, ""),
  );
  return cleanCaption(text);
}

async function fetchOEmbed(postUrl: string): Promise<{ imageUrl: string; caption: string }> {
  const token = process.env.META_OEMBED_TOKEN?.trim() || process.env.INSTAGRAM_OEMBED_TOKEN?.trim();
  const endpoint = token
    ? `https://graph.facebook.com/v22.0/instagram_oembed?url=${encodeURIComponent(postUrl)}&access_token=${encodeURIComponent(token)}`
    : `https://api.instagram.com/oembed?url=${encodeURIComponent(postUrl)}`;

  const res = await fetch(endpoint, {
    headers: { Accept: "application/json", "User-Agent": UA },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return { imageUrl: "", caption: "" };

  const data = (await res.json()) as { thumbnail_url?: string; title?: string };
  const imageUrl = safeHref(data.thumbnail_url);
  return {
    imageUrl: imageUrl && isAllowedImageUrl(imageUrl) ? imageUrl : "",
    caption: cleanCaption(data.title || ""),
  };
}

async function fetchMediaRedirect(ref: { kind: string; shortcode: string }): Promise<string> {
  const mediaUrl = `https://www.instagram.com/${ref.kind}/${ref.shortcode}/media/?size=l`;
  const res = await fetch(mediaUrl, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://www.instagram.com/" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return "";
  const finalUrl = res.url || "";
  if (isAllowedImageUrl(finalUrl)) return finalUrl;
  const type = res.headers.get("content-type") || "";
  if (type.startsWith("image/") && isAllowedImageUrl(finalUrl)) return finalUrl;
  return "";
}

async function fetchPageMeta(postUrl: string): Promise<{ imageUrl: string; caption: string }> {
  const res = await fetch(postUrl, {
    headers: { "User-Agent": UA, Accept: "text/html", Referer: "https://www.instagram.com/" },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return { imageUrl: "", caption: "" };
  const html = await res.text();
  return {
    imageUrl: imageFromHtml(html),
    caption: captionFromHtml(html),
  };
}

async function resolveInstagramPostMeta(postUrl: string): Promise<{ imageUrl: string; caption: string }> {
  const href = safeHref(postUrl);
  const ref = parseInstagramPost(href);
  if (!ref) return { imageUrl: "", caption: "" };

  let imageUrl = "";
  let caption = "";

  try {
    caption = await fetchEmbedCaption(href);
  } catch {
    // try other sources
  }

  try {
    const oembed = await fetchOEmbed(href);
    imageUrl = oembed.imageUrl;
    if (!caption) caption = oembed.caption;
  } catch {
    // try other sources
  }

  if (!caption || !imageUrl) {
    try {
      const page = await fetchPageMeta(href);
      if (!caption) caption = page.caption;
      if (!imageUrl) imageUrl = page.imageUrl;
    } catch {
      // try media redirect for image only
    }
  }

  if (!imageUrl) {
    try {
      imageUrl = await fetchMediaRedirect(ref);
    } catch {
      // no image available
    }
  }

  return { imageUrl, caption };
}

export async function resolveInstagramImageUrl(postUrl: string): Promise<string> {
  const meta = await resolveInstagramPostMeta(postUrl);
  return meta.imageUrl;
}

export function instagramPhotoProxyUrl(postUrl: string): string {
  return `/resources/instagram-photo?post=${encodeURIComponent(postUrl)}`;
}

export async function resolveInstagramPhotos(posts: string): Promise<InstagramPhoto[]> {
  const lines = parseInstagramPostLines(posts);
  if (!lines.length) return [];

  return Promise.all(
    lines.map(async ({ href, caption: manualCaption }) => {
      const meta = manualCaption ? { imageUrl: "", caption: manualCaption } : await resolveInstagramPostMeta(href);
      const caption = manualCaption || meta.caption;
      return {
        href,
        src: instagramPhotoProxyUrl(href),
        alt: caption || "Instagram post",
        caption,
      };
    }),
  );
}

export async function fetchInstagramImage(postUrl: string): Promise<Response | null> {
  const imageUrl = await resolveInstagramImageUrl(postUrl);
  if (!imageUrl) return null;

  const res = await fetch(imageUrl, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*", Referer: "https://www.instagram.com/" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;

  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return null;

  return new Response(await res.arrayBuffer(), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
