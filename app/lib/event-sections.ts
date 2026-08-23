export type EventSectionId = "requests" | "instagram" | "videos" | "photos" | "setlists";

export interface EventPageSection {
  id: EventSectionId;
  visible: boolean;
}

export const EVENT_SECTION_LABELS: Record<EventSectionId, string> = {
  requests: "Request a song",
  instagram: "From Instagram",
  videos: "Videos",
  photos: "Photos",
  setlists: "Setlists",
};

const ALL_SECTION_IDS: EventSectionId[] = ["requests", "instagram", "videos", "photos", "setlists"];

export function defaultPageSections(status: string): EventPageSection[] {
  if (status === "upcoming") {
    return [
      { id: "requests", visible: true },
      { id: "instagram", visible: true },
      { id: "photos", visible: true },
      { id: "setlists", visible: true },
      { id: "videos", visible: false },
    ];
  }
  return [
    { id: "videos", visible: true },
    { id: "photos", visible: true },
    { id: "requests", visible: true },
    { id: "setlists", visible: true },
    { id: "instagram", visible: false },
  ];
}

export function parsePageSections(raw: unknown, status: string): EventPageSection[] {
  const defaults = defaultPageSections(status);
  if (!raw) return defaults;

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return defaults;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return defaults;
    }
  }

  if (!Array.isArray(parsed)) return defaults;

  const seen = new Set<EventSectionId>();
  const sections: EventPageSection[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: string }).id;
    if (!id || !ALL_SECTION_IDS.includes(id as EventSectionId) || seen.has(id as EventSectionId)) continue;
    seen.add(id as EventSectionId);
    sections.push({
      id: id as EventSectionId,
      visible: (item as { visible?: boolean }).visible !== false,
    });
  }

  for (const fallback of defaults) {
    if (!seen.has(fallback.id)) sections.push(fallback);
  }

  return sections.length ? sections : defaults;
}

export function serializePageSections(sections: EventPageSection[]): string {
  return JSON.stringify(sections);
}

export function movePageSection(sections: EventPageSection[], id: EventSectionId, dir: -1 | 1): EventPageSection[] {
  const index = sections.findIndex((section) => section.id === id);
  const other = index + dir;
  if (index < 0 || other < 0 || other >= sections.length) return sections;
  const next = sections.slice();
  [next[index], next[other]] = [next[other], next[index]];
  return next;
}

export function togglePageSection(sections: EventPageSection[], id: EventSectionId): EventPageSection[] {
  return sections.map((section) =>
    section.id === id ? { ...section, visible: !section.visible } : section,
  );
}
