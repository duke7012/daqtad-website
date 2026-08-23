export const SITE_ORIGIN = "https://daqtad.org";

export function safeHref(url: string | null | undefined): string {
  const clean = String(url ?? "").replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean) && !/^https?:/i.test(clean)) return "";
  return clean;
}

export function rooted(url: string | null | undefined): string {
  const clean = safeHref(url);
  if (!clean || /^https?:\/\//i.test(clean) || clean.charAt(0) === "/") return clean;
  return `/${clean}`;
}

export function eventHref(ev: { page?: string; slug?: string }): string {
  const page = rooted(ev.page);
  if (page) return page;
  return ev.slug ? `/events/${encodeURIComponent(ev.slug)}` : "/events";
}

export function absolute(url: string | null | undefined): string {
  const path = rooted(url);
  if (!path) return "";
  return /^https?:\/\//i.test(path) ? path : `${SITE_ORIGIN}${path}`;
}

const YOUTUBE_HOST = /^https?:\/\/(?:[\w-]+\.)*(?:youtube\.com|youtube-nocookie\.com|youtu\.be)\//i;

export function youtubeId(value: string | null | undefined): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return /^[\w-]+$/.test(raw) ? raw : "";
  if (!YOUTUBE_HOST.test(raw)) return "";

  const watch = /[?&]v=([\w-]+)/.exec(raw);
  if (watch) return watch[1];

  const path =
    /^https?:\/\/[^/?#]+\/(?:embed|shorts|live|v)\/([\w-]+)/i.exec(raw) ||
    /^https?:\/\/(?:[\w-]+\.)*youtu\.be\/([\w-]+)/i.exec(raw);
  return path ? path[1] : "";
}

export function youtubeIds(value: string | null | undefined): string[] {
  const raw = String(value ?? "");
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const chunk of raw.split(/[\n,]+/)) {
    const id = youtubeId(chunk);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

const INSTAGRAM_POST =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i;

export function parseInstagramPost(value: string | null | undefined): { kind: string; shortcode: string; href: string } | null {
  const href = safeHref(value);
  if (!href) return null;
  const match = INSTAGRAM_POST.exec(href);
  if (!match) return null;
  const kind = /\/reel\//i.test(href) ? "reel" : /\/tv\//i.test(href) ? "tv" : "p";
  return { kind, shortcode: match[1], href: `https://www.instagram.com/${kind}/${match[1]}/` };
}

export function instagramPostUrls(value: string | null | undefined): string[] {
  return parseInstagramPostLines(value).map((item) => item.href);
}

export function parseInstagramPostLines(value: string | null | undefined): { href: string; caption: string }[] {
  const raw = String(value ?? "");
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const items: { href: string; caption: string }[] = [];

  for (const chunk of raw.split(/[\n,]+/)) {
    const line = chunk.trim();
    if (!line) continue;

    const manual = /^\s*(.+?)\s*\|\s*(.+)\s*$/.exec(line);
    const postPart = manual ? manual[1] : line;
    const manualCaption = manual ? manual[2].trim() : "";

    const ref = parseInstagramPost(postPart);
    if (!ref || seen.has(ref.href)) continue;
    seen.add(ref.href);
    items.push({ href: ref.href, caption: manualCaption });
  }

  return items;
}

export function isCustomEventPage(page: string | null | undefined): boolean {
  return rooted(page) === "/events/popup";
}

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function padTo(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

export function totalSongs(ev: { rounds: { songs: unknown[] }[] }): number {
  return ev.rounds.reduce((sum, round) => sum + round.songs.length, 0);
}
