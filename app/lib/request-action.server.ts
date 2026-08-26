import { addRequest } from "~/lib/requests.server";
import type { EventItem } from "~/types";

export async function handleSongRequest(formData: FormData, event: EventItem) {
  return addRequest(event.id, {
    song: String(formData.get("song") || "").trim(),
    artist: String(formData.get("artist") || "").trim() || "-",
    time: String(formData.get("time") || "").trim() || "any part",
    link: String(formData.get("link") || "").trim(),
  });
}
