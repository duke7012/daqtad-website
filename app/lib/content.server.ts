import { parsePageSections } from "~/lib/event-sections";
import { sampleSite } from "~/lib/fallback.server";
import {
  extraPhotos,
  sampleAboutContent,
  sampleExtrasContent,
} from "~/lib/pages";
import { getConfig, isConfigured, rest, withTimeout } from "~/lib/supabase.server";
import type {
  AboutPageContent,
  AboutSection,
  EventItem,
  ExtraProject,
  ExtrasPageContent,
  Faq,
  Photo,
  SiteData,
} from "~/types";

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
  banner_url?: string;
  drive_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  show_instagram?: boolean;
  show_facebook?: boolean;
  show_youtube?: boolean;
  show_drive?: boolean;
  requests_open?: boolean;
  video?: string;
  instagram_posts?: string;
  page_sections?: unknown;
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
  about_title?: string;
  about_pronunciation?: string;
  about_intro?: string;
  about_mosaic_photos?: string;
  about_vietnam_photos?: string;
  about_utah_photos?: string;
  extras_title?: string;
  extras_intro?: string;
}

interface DbAboutSection {
  id: string;
  heading: string;
  body: string;
  mission?: string;
  closing?: string;
  link_label?: string;
  link_href?: string;
  videos?: string;
  position?: number;
}

interface DbExtraProject {
  id: string;
  slug: string;
  title: string;
  eyebrow?: string;
  body?: string;
  videos?: string;
  photo_count?: number;
  position?: number;
}

interface DbAboutPhoto {
  section_id?: string | null;
  url: string;
  alt?: string;
  position?: number;
}

interface DbExtraPhoto {
  project_id: string;
  url: string;
  alt?: string;
  position?: number;
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
  const title = row.name + (row.subtitle ? ` · ${row.subtitle}` : "");
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
      alt: photo.alt || `${title} photo ${i + 1}`,
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
    banner: row.banner_url || (row.status === "upcoming" ? "/assets/images/events/bopsim2026-bg.jpg" : ""),
    drive: row.drive_url || "",
    instagramUrl: row.instagram_url || "",
    facebookUrl: row.facebook_url || "",
    youtubeUrl: row.youtube_url || "",
    showInstagram: row.show_instagram !== false,
    showFacebook: row.show_facebook !== false,
    showYoutube: !!row.show_youtube,
    showDrive: row.show_drive !== false,
    requestsOpen: !!row.requests_open,
    video: row.video || "",
    instagramPosts: row.instagram_posts || "",
    pageSections: parsePageSections(row.page_sections, row.status),
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
    console.warn("[daqtad] using sample content -", message);
    return sampleSite();
  }
}

export function getEvent(site: SiteData, slug: string): EventItem | undefined {
  return site.events.find((ev) => ev.slug === slug);
}

/** True while admin marked upcoming and the start time is still in the future. */
export function isLiveUpcoming(event: EventItem, now = Date.now()): boolean {
  if (event.status !== "upcoming") return false;
  if (!event.startsAt) return true;
  const start = new Date(event.startsAt).getTime();
  if (Number.isNaN(start)) return true;
  return start > now;
}

export function upcomingEvents(site: SiteData, now = Date.now()): EventItem[] {
  return site.events
    .filter((ev) => isLiveUpcoming(ev, now))
    .slice()
    .sort((a, b) => {
      const aTime = a.startsAt ? new Date(a.startsAt).getTime() : Number.POSITIVE_INFINITY;
      const bTime = b.startsAt ? new Date(b.startsAt).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });
}

export function upcomingEvent(site: SiteData, now = Date.now()): EventItem | undefined {
  return upcomingEvents(site, now)[0];
}

export function pastEvents(site: SiteData, now = Date.now()): EventItem[] {
  return site.events.filter((ev) => !isLiveUpcoming(ev, now));
}

export function formspreeEndpoint(): string {
  return sampleSite().requests.endpoint;
}

function mapAboutSection(row: DbAboutSection, photos: Photo[]): AboutSection {
  return {
    id: row.id,
    heading: row.heading || "",
    body: row.body || "",
    mission: row.mission || "",
    closing: row.closing || "",
    linkLabel: row.link_label || "",
    linkHref: row.link_href || "",
    videos: row.videos || "",
    photos,
  };
}

function mapExtraProject(row: DbExtraProject, photos: Photo[]): ExtraProject {
  const project = {
    id: row.id,
    slug: row.slug || row.id,
    title: row.title || "",
    eyebrow: row.eyebrow || "",
    body: row.body || "",
    videos: row.videos || "",
    photoCount: Number(row.photo_count) || 0,
    photos,
  };
  if (!project.photos.length && project.photoCount > 0) {
    project.photos = extraPhotos(project);
  }
  return project;
}

function buildAbout(
  settings: DbSettings | undefined,
  sections: DbAboutSection[],
  photoRows: DbAboutPhoto[],
): AboutPageContent {
  const sample = sampleAboutContent();
  const introPhotos: Photo[] = [];
  const bySection = new Map<string, Photo[]>();
  for (const row of photoRows.slice().sort(byPosition)) {
    const photo = {
      src: row.url,
      alt: row.alt || "About photo",
    };
    if (!row.section_id) {
      introPhotos.push(photo);
      continue;
    }
    const list = bySection.get(row.section_id) || [];
    list.push(photo);
    bySection.set(row.section_id, list);
  }
  return {
    title: settings?.about_title || sample.title,
    pronunciation: settings?.about_pronunciation || sample.pronunciation,
    intro: settings?.about_intro || sample.intro,
    introPhotos,
    sections: sections.length
      ? sections.map((row) => mapAboutSection(row, bySection.get(row.id) || []))
      : sample.sections,
  };
}

function buildExtras(
  settings: DbSettings | undefined,
  projects: DbExtraProject[],
  photoRows: DbExtraPhoto[],
): ExtrasPageContent {
  const sample = sampleExtrasContent();
  const byProject = new Map<string, Photo[]>();
  for (const row of photoRows.slice().sort(byPosition)) {
    const list = byProject.get(row.project_id) || [];
    list.push({
      src: row.url,
      alt: row.alt || "Extras photo",
    });
    byProject.set(row.project_id, list);
  }
  return {
    title: settings?.extras_title || sample.title,
    intro: settings?.extras_intro || sample.intro,
    projects: projects.length
      ? projects.map((row) => mapExtraProject(row, byProject.get(row.id) || []))
      : sample.projects,
  };
}

async function loadAboutFromDatabase(): Promise<AboutPageContent> {
  const [settingRows, sectionRows, photoRows] = await Promise.all([
    rest<DbSettings[]>("site_settings?select=*&limit=1"),
    rest<DbAboutSection[]>("about_sections?select=*&order=position.asc"),
    rest<DbAboutPhoto[]>("about_photos?select=*&order=position.asc").catch(() => [] as DbAboutPhoto[]),
  ]);
  return buildAbout(settingRows?.[0], sectionRows || [], photoRows || []);
}

async function loadExtrasFromDatabase(): Promise<ExtrasPageContent> {
  const [settingRows, projectRows, photoRows] = await Promise.all([
    rest<DbSettings[]>("site_settings?select=*&limit=1"),
    rest<DbExtraProject[]>("extras_projects?select=*&order=position.asc"),
    rest<DbExtraPhoto[]>("extras_photos?select=*&order=position.asc").catch(() => [] as DbExtraPhoto[]),
  ]);
  return buildExtras(settingRows?.[0], projectRows || [], photoRows || []);
}

export async function loadAboutPage(): Promise<AboutPageContent> {
  if (!isConfigured()) return sampleAboutContent();
  try {
    return await withTimeout(loadAboutFromDatabase());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[daqtad] using sample about content -", message);
    return sampleAboutContent();
  }
}

export async function loadExtrasPage(): Promise<ExtrasPageContent> {
  if (!isConfigured()) return sampleExtrasContent();
  try {
    return await withTimeout(loadExtrasFromDatabase());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[daqtad] using sample extras content -", message);
    return sampleExtrasContent();
  }
}

export { getConfig, isConfigured };
