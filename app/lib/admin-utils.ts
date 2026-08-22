export const TIMEZONES = [
  "America/Denver",
  "America/Los_Angeles",
  "America/Chicago",
  "America/New_York",
  "Asia/Ho_Chi_Minh",
  "UTC",
];

export function offsetFor(timeZone: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const name = parts.find((part) => part.type === "timeZoneName");
    const match = /GMT([+-]\d{2}:\d{2})/.exec(name?.value ?? "");
    return match ? match[1] : "+00:00";
  } catch {
    return "+00:00";
  }
}

export function toIso(dateStr: string, timeStr: string, timeZone: string): string | null {
  if (!dateStr) return null;
  const local = `${dateStr}T${timeStr || "00:00"}:00`;
  const guess = offsetFor(timeZone, new Date(`${local}Z`));
  const refined = offsetFor(timeZone, new Date(local + guess));
  return new Date(local + refined).toISOString();
}

export function fromIso(iso: string | null | undefined, timeZone: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
    const hour = get("hour") === "24" ? "00" : get("hour");
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      time: `${hour}:${get("minute")}`,
    };
  } catch {
    return { date: "", time: "" };
  }
}

export function parseSongLines(text: string): { title: string; artist: string }[] {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const cleaned = line.replace(/^\d+\s*[.)\]:-]\s*/, "");
      const parts = cleaned.split(/\s+[—–|]\s+|\s+-\s+|\t+/);
      if (parts.length >= 2) {
        return { title: parts[0].trim(), artist: parts.slice(1).join(" - ").trim() };
      }
      return { title: cleaned, artist: "" };
    })
    .filter((song) => song.title);
}
