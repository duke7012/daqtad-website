import type { EventPageSection } from "~/lib/event-sections";

export type EventStatus = "upcoming" | "past";

export interface Photo {
  src: string;
  alt: string;
}

export interface Round {
  label: string;
  songs: [string, string][];
}

export interface EventItem {
  id?: string;
  slug: string;
  status: EventStatus | string;
  title: string;
  name: string;
  subtitle: string;
  page: string;
  startsAt: string;
  dateLabel: string;
  monthLabel?: string;
  timeLabel?: string;
  venue: string;
  venueShort: string;
  badge?: string;
  cta?: string;
  stats?: string;
  poster: string;
  posterAlt: string;
  cover: string;
  banner: string;
  drive?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  showInstagram?: boolean;
  showFacebook?: boolean;
  showYoutube?: boolean;
  showDrive?: boolean;
  requestsOpen?: boolean;
  video: string;
  instagramPosts: string;
  pageSections: EventPageSection[];
  photos: Photo[];
  rounds: Round[];
}

export interface Faq {
  q: string;
  a: string;
}

export interface Social {
  instagram: string;
  facebook: string;
}

export interface SongRequest {
  id?: string;
  name: string;
  song: string;
  artist: string;
  time: string;
  link: string;
}

export interface SiteData {
  source: "database" | "sample";
  social: Social;
  requests: { endpoint: string };
  events: EventItem[];
  faqs: Faq[];
}

export interface AdminEvent {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  status: string;
  timezone: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  venue_short: string | null;
  badge: string | null;
  cta: string | null;
  stats: string | null;
  video: string | null;
  instagram_posts: string | null;
  page_sections: unknown;
  poster_url: string | null;
  cover_url: string | null;
  banner_url: string | null;
  drive_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  show_instagram: boolean | null;
  show_facebook: boolean | null;
  show_youtube: boolean | null;
  show_drive: boolean | null;
  page: string | null;
  position: number | null;
  requests_open: boolean | null;
}

export interface AdminRound {
  id: string;
  event_id: string;
  label: string;
  position: number;
  count?: number;
}

export interface AdminPhoto {
  id: string;
  event_id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface AdminSong {
  id: string;
  title: string;
  artist: string;
}

export interface AdminRoundSong {
  id: string;
  position: number;
  song_id: string;
  songs: { id: string; title: string; artist: string } | null;
}

export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  position: number;
}

export interface AdminAboutSection {
  id: string;
  heading: string;
  body: string;
  mission: string;
  closing: string;
  link_label: string;
  link_href: string;
  photo_band: string;
  videos: string;
  position: number;
}

export interface AdminAboutPhoto {
  id: string;
  section_id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface AdminExtraProject {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  body: string;
  videos: string;
  photo_count: number;
  position: number;
}

export interface AdminExtraPhoto {
  id: string;
  project_id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface AdminSettings {
  id?: boolean;
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

export interface AboutSection {
  id: string;
  heading: string;
  body: string;
  mission: string;
  closing: string;
  linkLabel: string;
  linkHref: string;
  videos: string;
  photos: Photo[];
}

export interface AboutPageContent {
  title: string;
  pronunciation: string;
  intro: string;
  sections: AboutSection[];
}

export interface ExtraProject {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  body: string;
  videos: string;
  photoCount: number;
  photos: Photo[];
}

export interface ExtrasPageContent {
  title: string;
  intro: string;
  projects: ExtraProject[];
}

export interface AdminRequestRow {
  id: string;
  event_id: string;
  name: string | null;
  song: string;
  artist: string | null;
  part: string | null;
  link: string | null;
  created_at: string;
}
