import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSongLines } from "~/lib/admin-utils";
import type {
  AdminEvent,
  AdminFaq,
  AdminPhoto,
  AdminRequestRow,
  AdminRound,
  AdminRoundSong,
  AdminSettings,
  AdminSong,
} from "~/types";

const SONG_PAGE = 1000;
export { TIMEZONES, fromIso, parseSongLines, toIso } from "~/lib/admin-utils";

async function q<T>(builder: PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>) {
  const result = await builder;
  if (result.error) throw result.error;
  return result.data as T;
}

function songKey(title: string, artist: string) {
  return `${title}|${artist}`.toLowerCase();
}

function isDuplicate(error: { code?: string; message?: string } | null) {
  return !!error && (error.code === "23505" || /duplicate key|already exists/i.test(error.message || ""));
}

export async function listEvents(sb: SupabaseClient): Promise<AdminEvent[]> {
  return (await q<AdminEvent[]>(sb.from("events").select("*").order("position", { ascending: false }))) || [];
}

async function fetchSongPage(sb: SupabaseClient, from: number, collected: AdminSong[]): Promise<AdminSong[]> {
  const page =
    (await q<AdminSong[]>(
      sb.from("songs").select("*").order("title", { ascending: true }).order("id", { ascending: true }).range(from, from + SONG_PAGE - 1),
    )) || [];
  const all = collected.concat(page);
  if (!page.length) return all;
  return fetchSongPage(sb, from + page.length, all);
}

export async function listSongs(sb: SupabaseClient): Promise<AdminSong[]> {
  return fetchSongPage(sb, 0, []);
}

export async function listFaqs(sb: SupabaseClient): Promise<AdminFaq[]> {
  return (await q<AdminFaq[]>(sb.from("faqs").select("*").order("position", { ascending: true }))) || [];
}

export async function getSettings(sb: SupabaseClient): Promise<AdminSettings> {
  const rows = await q<AdminSettings[]>(sb.from("site_settings").select("*").limit(1));
  return rows?.[0] || {};
}

export async function loadEventDetail(
  sb: SupabaseClient,
  eventId: string,
): Promise<{ rounds: AdminRound[]; photos: AdminPhoto[] }> {
  const [rounds, photos] = await Promise.all([
    q<AdminRound[]>(sb.from("rounds").select("*").eq("event_id", eventId).order("position")),
    q<AdminPhoto[]>(sb.from("photos").select("*").eq("event_id", eventId).order("position")),
  ]);
  const list = rounds || [];
  if (list.length) {
    const ids = list.map((round) => round.id);
    const rows = (await q<{ round_id: string }[]>(sb.from("round_songs").select("round_id").in("round_id", ids))) || [];
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.round_id] = (counts[row.round_id] || 0) + 1;
    for (const round of list) round.count = counts[round.id] || 0;
  }
  return { rounds: list, photos: photos || [] };
}

export async function loadRoundSongs(sb: SupabaseClient, roundId: string): Promise<AdminRoundSong[]> {
  const rows =
    (await q<
      {
        id: string;
        position: number;
        song_id: string;
        songs: { id: string; title: string; artist: string } | { id: string; title: string; artist: string }[] | null;
      }[]
    >(
      sb
        .from("round_songs")
        .select("id,position,song_id,songs(id,title,artist)")
        .eq("round_id", roundId)
        .order("position"),
    )) || [];

  return rows.map((row) => ({
    id: row.id,
    position: row.position,
    song_id: row.song_id,
    songs: Array.isArray(row.songs) ? row.songs[0] || null : row.songs,
  }));
}

export async function listRequestsFor(sb: SupabaseClient, eventId: string): Promise<AdminRequestRow[]> {
  if (!eventId) return [];
  return (
    (await q<AdminRequestRow[]>(
      sb.from("song_requests").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
    )) || []
  );
}

function nextPosition(list: { position?: number | null }[]) {
  return list.reduce((max, row) => Math.max(max, row.position || 0), -1) + 1;
}

export async function saveEvent(
  sb: SupabaseClient,
  id: string | undefined,
  payload: Record<string, unknown>,
): Promise<AdminEvent> {
  if (id) {
    return q<AdminEvent>(sb.from("events").update(payload).eq("id", id).select().single());
  }
  return q<AdminEvent>(sb.from("events").insert(payload).select().single());
}

export async function deleteEvent(sb: SupabaseClient, id: string) {
  await q(sb.from("events").delete().eq("id", id));
}

export async function addRound(sb: SupabaseClient, eventId: string, label: string, rounds: AdminRound[]) {
  await q(sb.from("rounds").insert({ event_id: eventId, label, position: nextPosition(rounds) }));
}

export async function renameRound(sb: SupabaseClient, id: string, label: string) {
  await q(sb.from("rounds").update({ label }).eq("id", id));
}

export async function deleteRound(sb: SupabaseClient, id: string) {
  await q(sb.from("rounds").delete().eq("id", id));
}

export async function swapPositions(
  sb: SupabaseClient,
  table: "rounds" | "photos" | "faqs" | "round_songs",
  list: { id: string }[],
  id: string,
  direction: number,
) {
  const index = list.findIndex((row) => row.id === id);
  const other = index + direction;
  if (index < 0 || other < 0 || other >= list.length) return;
  const a = list[index];
  const b = list[other];
  await Promise.all([
    q(sb.from(table).update({ position: other }).eq("id", a.id)),
    q(sb.from(table).update({ position: index }).eq("id", b.id)),
  ]);
}

export async function removeRoundSong(sb: SupabaseClient, id: string) {
  await q(sb.from("round_songs").delete().eq("id", id));
}

function songLibrary(songs: AdminSong[]) {
  const known: Record<string, AdminSong> = {};
  for (const song of songs) known[songKey(song.title, song.artist)] = song;
  return known;
}

async function insertMissing(
  sb: SupabaseClient,
  wanted: { title: string; artist: string }[],
  songs: AdminSong[],
  retry: boolean,
): Promise<{ added: number; songs: AdminSong[] }> {
  const known = songLibrary(songs);
  const missing = wanted.filter((song) => !known[songKey(song.title, song.artist)]);
  if (!missing.length) return { added: 0, songs };

  const { data, error } = await sb.from("songs").insert(missing).select();
  if (error) {
    if (retry && isDuplicate(error)) {
      const fresh = await listSongs(sb);
      return insertMissing(sb, wanted, fresh, false);
    }
    throw error;
  }
  const rows = (data || []) as AdminSong[];
  return { added: rows.length, songs: songs.concat(rows) };
}

export async function ensureSongs(sb: SupabaseClient, parsed: { title: string; artist: string }[]) {
  const wanted: { title: string; artist: string }[] = [];
  const seen: Record<string, boolean> = {};
  for (const song of parsed) {
    const key = songKey(song.title, song.artist);
    if (seen[key]) continue;
    seen[key] = true;
    wanted.push({ title: song.title, artist: song.artist });
  }

  let songs = await listSongs(sb);
  const result = await insertMissing(sb, wanted, songs, true);
  songs = result.songs;
  const known = songLibrary(songs);
  return {
    added: result.added,
    songs: parsed.map((song) => known[songKey(song.title, song.artist)]).filter(Boolean),
  };
}

export async function addSongsToRound(sb: SupabaseClient, roundId: string, songIds: string[], existing: AdminRoundSong[]) {
  const start = nextPosition(existing);
  const rows = songIds.map((song_id, i) => ({
    round_id: roundId,
    song_id,
    position: start + i,
  }));
  if (!rows.length) return 0;
  await q(sb.from("round_songs").insert(rows));
  return rows.length;
}

export async function replaceRoundSongs(sb: SupabaseClient, roundId: string) {
  await q(sb.from("round_songs").delete().eq("round_id", roundId));
}

export async function addSong(sb: SupabaseClient, title: string, artist: string) {
  await q(sb.from("songs").insert({ title, artist }));
}

export async function updateSong(sb: SupabaseClient, id: string, patch: { title?: string; artist?: string }) {
  await q(sb.from("songs").update(patch).eq("id", id));
}

export async function deleteSong(sb: SupabaseClient, id: string) {
  await q(sb.from("songs").delete().eq("id", id));
}

export async function addFaq(sb: SupabaseClient, faqs: AdminFaq[]) {
  await q(sb.from("faqs").insert({ question: "New question", answer: "", position: nextPosition(faqs) }));
}

export async function updateFaq(sb: SupabaseClient, id: string, patch: { question?: string; answer?: string }) {
  await q(sb.from("faqs").update(patch).eq("id", id));
}

export async function deleteFaq(sb: SupabaseClient, id: string) {
  await q(sb.from("faqs").delete().eq("id", id));
}

export async function deleteRequest(sb: SupabaseClient, id: string) {
  await q(sb.from("song_requests").delete().eq("id", id));
}

export async function saveSettings(sb: SupabaseClient, values: { instagram: string; facebook: string }) {
  await q(
    sb
      .from("site_settings")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", true),
  );
}

export async function updatePhotoAlt(sb: SupabaseClient, id: string, alt: string) {
  await q(sb.from("photos").update({ alt }).eq("id", id));
}

export async function deletePhoto(sb: SupabaseClient, id: string) {
  await q(sb.from("photos").delete().eq("id", id));
}

export async function uploadFile(sb: SupabaseClient, file: File, folder: string): Promise<string> {
  const clean = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${Date.now()}-${clean}`;
  await q(sb.storage.from("media").upload(path, file, { cacheControl: "3600" }));
  return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
}

export async function addPhotos(sb: SupabaseClient, eventId: string, urls: string[], photos: AdminPhoto[]) {
  const position = nextPosition(photos);
  if (!urls.length) return;
  await q(
    sb.from("photos").insert(
      urls.map((url, i) => ({
        event_id: eventId,
        url,
        alt: "",
        position: position + i,
      })),
    ),
  );
}
