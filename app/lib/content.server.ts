import { sampleSite } from "~/lib/fallback.server";
import { getConfig, isConfigured, rest, withTimeout } from "~/lib/supabase.server";
import type { EventItem, Faq, SiteData } from "~/types";

interface DbSong {
  title: string;
  artist: string;
}

interface DbRoundSong {
  position?: number;
  songs?: DbSong | null;
}

interface DbRound {
  label: string;
  position?: number;
  round_songs?: DbRoundSong[];
}

interface DbPhoto {
  url: string;
  alt?: string;
  position?: number;
}

interface DbEvent {
  id: string;
  slug: string;
  status: string;
  name: string;
  subtitle?: string;
  page?: string;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
  venue?: string;
  venue_short?: string;
  badge?: string;
  cta?: string;
  stats?: string;
  poster_url?: string;
  cover_url?: string;
  drive_url?: string;
  requests_open?: boolean;
  video?: string;
  rounds?: DbRound[];
  photos?: DbPhoto[];
}

interface DbFaq {
  question: string;
  answer: string;
}

interface DbSettings {
  instagram?: string;
  facebook?: string;
}

function byPosition(a: { position?: number }, b: { position?: number }) {
  return (a.position || 0) - (b.position || 0);
}

function formatDate(
  iso: string | undefined,
  timezone: string | undefined,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone || "America/Denver",
      ...options,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function timeLabel(startIso?: string, endIso?: string, timezone?: string): string {
  const clock: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  const start = formatDate(startIso, timezone, clock);
  if (!start) return "";
  if (!endIso) return start;
  const end = formatDate(endIso, timezone, clock);
  if (!end) return start;
  const startMeridiem = start.slice(-2);
  if (startMeridiem === end.slice(-2)) {
    return `${start.replace(/\s*[AP]M$/, "")}–${end}`;
  }
  return `${start}–${end}`;
}

function mapEvent(row: DbEvent): EventItem {
  const title = row.name + (row.subtitle ? ` — ${row.subtitle}` : "");
  const rounds = (row.rounds || [])
    .slice()
    .sort(byPosition)
    .map((round) => {
      const songs = (round.round_songs || [])
        .slice()
        .sort(byPosition)
        .filter((entry) => entry.songs)
        .map((entry) => [entry.songs!.title, entry.songs!.artist] as [string, string]);
      return { label: round.label, songs };
    });

  const photos = (row.photos || [])
    .slice()
    .sort(byPosition)
    .map((photo, i) => ({
      src: photo.url,
      alt: photo.alt || `${title} — photo ${i + 1}`,
    }));

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    title,
    name: row.name,
    subtitle: row.subtitle || "",
    page: row.page || `/events/${encodeURIComponent(row.slug)}`,
    startsAt: row.starts_at || "",
    dateLabel: formatDate(row.starts_at, row.timezone, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    monthLabel: formatDate(row.starts_at, row.timezone, {
      month: "short",
      year: "numeric",
    }),
    timeLabel: timeLabel(row.starts_at, row.ends_at, row.timezone),
    venue: row.venue || "",
    venueShort: row.venue_short || row.venue || "",
    badge: row.badge || "",
    cta: row.cta || "",
    stats: row.stats || "",
    poster: row.poster_url || "",
    posterAlt: `${title} event poster`,
    cover: row.cover_url || "",
    drive: row.drive_url || "",
    requestsOpen: !!row.requests_open,
    video: row.video || "",
    photos,
    rounds,
  };
}

function build(events: EventItem[], faqs: Faq[], settings?: DbSettings): SiteData {
  return {
    source: "database",
    social: {
      instagram: settings?.instagram || "",
      facebook: settings?.facebook || "",
    },
    requests: { endpoint: "" },
    events,
    faqs,
  };
}

const SELECT =
  "select=*,rounds(id,label,position,round_songs(position,songs(title,artist))),photos(id,url,alt,position)";

async function loadFromDatabase(): Promise<SiteData> {
  const [eventRows, faqRows, settingRows] = await Promise.all([
    rest<DbEvent[]>(`events?${SELECT}&order=position.desc`),
    rest<DbFaq[]>("faqs?select=question,answer,position&order=position.asc"),
    rest<DbSettings[]>("site_settings?select=*&limit=1"),
  ]);

  const events = (eventRows || []).map(mapEvent);
  const faqs = (faqRows || []).map((row) => ({ q: row.question, a: row.answer }));
  const settings = settingRows?.[0];
  return build(events, faqs, settings);
}

export async function loadSite(): Promise<SiteData> {
  if (!isConfigured()) return sampleSite();
  try {
    return await withTimeout(loadFromDatabase());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[daqtad] using sample content —", message);
    return sampleSite();
  }
}

export function getEvent(site: SiteData, slug: string): EventItem | undefined {
  return site.events.find((ev) => ev.slug === slug);
}

export function upcomingEvent(site: SiteData): EventItem | undefined {
  return site.events.find((ev) => ev.status === "upcoming");
}

export function pastEvents(site: SiteData): EventItem[] {
  return site.events.filter((ev) => ev.status !== "upcoming");
}

export function formspreeEndpoint(): string {
  return sampleSite().requests.endpoint;
}

export { getConfig, isConfigured };
