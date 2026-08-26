import { formspreeEndpoint, isConfigured } from "~/lib/content.server";
import { rest } from "~/lib/supabase.server";
import type { SongRequest } from "~/types";

interface DbRequest {
  id?: string;
  name?: string;
  song: string;
  artist?: string;
  part?: string;
  link?: string;
}

export async function listRequests(eventId?: string): Promise<SongRequest[]> {
  if (!isConfigured() || !eventId) return [];
  try {
    const rows = await rest<DbRequest[]>(
      `song_requests?select=*&event_id=eq.${encodeURIComponent(eventId)}&order=created_at.desc&limit=200`,
    );
    return (rows || []).map((row) => ({
      id: row.id,
      name: row.name || "",
      song: row.song,
      artist: row.artist || "",
      time: row.part || "",
      link: row.link || "",
    }));
  } catch {
    return [];
  }
}

export async function addRequest(
  eventId: string | undefined,
  entry: { song: string; artist: string; time: string; link: string },
): Promise<{ ok: boolean; message: string; failed?: boolean }> {
  if (!entry.song) {
    return { ok: false, message: "Please add a song title.", failed: true };
  }

  if (isConfigured() && eventId) {
    try {
      await rest("song_requests", {
        method: "POST",
        prefer: "return=representation",
        body: {
          event_id: eventId,
          name: "anon",
          song: entry.song,
          artist: entry.artist,
          part: entry.time,
          link: entry.link,
        },
      });
      return { ok: true, message: "Requested! 💜 Thanks - we read every one." };
    } catch {
      return {
        ok: false,
        message: "Could not send right now - please DM us on Instagram instead.",
        failed: true,
      };
    }
  }

  const endpoint = formspreeEndpoint();
  if (!endpoint) {
    return {
      ok: false,
      message: "Could not send right now - please DM us on Instagram instead.",
      failed: true,
    };
  }

  try {
    const body = new URLSearchParams({
      song: entry.song,
      artist: entry.artist,
      time: entry.time,
      link: entry.link,
    });
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
    if (!response.ok) throw new Error("Request failed");
    return { ok: true, message: "Requested! 💜 Thanks - we read every one." };
  } catch {
    return {
      ok: false,
      message: "Could not send right now - please DM us on Instagram instead.",
      failed: true,
    };
  }
}
