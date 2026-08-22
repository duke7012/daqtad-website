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
