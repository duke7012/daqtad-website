import { useEffect } from "react";
import { data, redirect } from "react-router";
import { EventEditor } from "~/admin/EventEditor";
import { EventsTab } from "~/admin/EventsTab";
import { FaqsTab } from "~/admin/FaqsTab";
import { AdminTabs, Field, Status } from "~/admin/fields";
import { RequestsTab } from "~/admin/RequestsTab";
import { RoundEditor } from "~/admin/RoundEditor";
import { SettingsTab } from "~/admin/SettingsTab";
import { SongsTab } from "~/admin/SongsTab";
import { BrandLogo } from "~/components/BrandLogo";
import { parsePageSections } from "~/lib/event-sections";
import {
  addFaq,
  addPhotos,
  addRound,
  addSong,
  addSongsToRound,
  deleteEvent,
  deleteFaq,
  deletePhoto,
  deleteRequest,
  deleteRound,
  deleteSong,
  ensureSongs,
  getSettings,
  listEvents,
  listFaqs,
  listRequestsFor,
  listSongs,
  loadEventDetail,
  loadRoundSongs,
  parseSongLines,
  removeRoundSong,
  renameRound,
  replaceRoundSongs,
  saveEvent,
  saveSettings,
  swapPositions,
  toIso,
  updateFaq,
  updatePhotoAlt,
  updateSong,
  uploadFile,
} from "~/lib/admin.server";
import { getUser, isAdmin, mergeHeaders, signIn, signOut } from "~/lib/auth.server";
import { isConfigured } from "~/lib/content.server";
import { pageMeta } from "~/lib/meta";
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
import type { Route } from "./+types/admin";

export function meta() {
  return [
    ...pageMeta({
      title: "Admin · DA'QTAD",
      description: "Edit DA'QTAD site content.",
      path: "/admin",
      robots: "noindex, nofollow",
    }),
  ];
}

function str(form: FormData, name: string) {
  return String(form.get(name) || "").trim();
}

function eventPayload(form: FormData) {
  const zone = str(form, "timezone") || "America/Denver";
  const date = str(form, "date");
  const status = str(form, "status");
  // Poster/cover live in a separate form — omit them here so Save event
  // does not wipe existing image URLs with empty strings.
  return {
    slug: str(form, "slug"),
    name: str(form, "name"),
    subtitle: str(form, "subtitle"),
    status,
    timezone: zone,
    starts_at: toIso(date, str(form, "start_time"), zone),
    ends_at: str(form, "end_time") ? toIso(date, str(form, "end_time"), zone) : null,
    venue: str(form, "venue"),
    venue_short: str(form, "venue_short"),
    badge: str(form, "badge"),
    cta: str(form, "cta"),
    stats: str(form, "stats"),
    video: str(form, "video"),
    instagram_posts: str(form, "instagram_posts"),
    page_sections: parsePageSections(str(form, "page_sections"), status),
    page: str(form, "page"),
    drive_url: str(form, "drive_url"),
    instagram_url: str(form, "instagram_url"),
    facebook_url: str(form, "facebook_url"),
    youtube_url: str(form, "youtube_url"),
    show_instagram: form.get("show_instagram") === "on",
    show_facebook: form.get("show_facebook") === "on",
    show_youtube: form.get("show_youtube") === "on",
    show_drive: form.get("show_drive") === "on",
    position: Number(str(form, "position")) || 0,
    requests_open: form.get("requests_open") === "on",
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  if (!isConfigured()) {
    return { status: "unconfigured" as const };
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "events";
  const eventId = url.searchParams.get("event") || "";
  const roundId = url.searchParams.get("round") || "";
  let requestsFor = url.searchParams.get("requestsFor") || "";

  try {
    const { user, supabase, headers } = await getUser(request);
    if (!user) {
      return data({ status: "anon" as const, error: "" }, { headers });
    }
    const admin = await isAdmin(supabase);
    if (!admin) {
      return data({ status: "not-admin" as const, email: user.email || "" }, { headers });
    }

    const [events, songs, faqs, settings] = await Promise.all([
      listEvents(supabase),
      listSongs(supabase),
      listFaqs(supabase),
      getSettings(supabase),
    ]);

    requestsFor = requestsFor || events[0]?.id || "";
    const requests = tab === "requests" && requestsFor ? await listRequestsFor(supabase, requestsFor) : [];

    let event: Partial<AdminEvent> | null = null;
    let rounds: AdminRound[] = [];
    let photos: AdminPhoto[] = [];
    let round: AdminRound | null = null;
    let roundSongs: AdminRoundSong[] = [];

    if (eventId === "new") {
      event = { status: "upcoming", timezone: "America/Denver", position: 0 };
    } else if (eventId) {
      event = events.find((item) => item.id === eventId) || null;
      if (event?.id) {
        const detail = await loadEventDetail(supabase, event.id);
        rounds = detail.rounds;
        photos = detail.photos;
        if (roundId) {
          round = rounds.find((item) => item.id === roundId) || null;
          if (round) roundSongs = await loadRoundSongs(supabase, round.id);
        }
      }
    }

    return data(
      {
        status: "ok" as const,
        email: user.email || "",
        tab,
        events,
        songs,
        faqs,
        settings,
        requests,
        requestsFor,
        event,
        rounds,
        photos,
        round,
        roundSongs,
      },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reach the database.";
    return { status: "anon" as const, error: message };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const intent = str(form, "intent");

  if (intent === "login") {
    const result = await signIn(request, str(form, "email"), str(form, "password"));
    if (result.error) {
      return data({ status: "anon", error: result.error, failed: true }, { headers: result.headers });
    }
    return redirect("/admin", { headers: result.headers });
  }

  if (intent === "logout") {
    const result = await signOut(request);
    return redirect("/admin", { headers: result.headers });
  }

  const { user, supabase, headers } = await getUser(request);
  if (!user || !(await isAdmin(supabase))) {
    return data({ message: "Not signed in as admin.", failed: true }, { headers, status: 401 });
  }

  const ok = (message: string, extra?: Record<string, unknown>) =>
    data({ message, failed: false, ...extra }, { headers: mergeHeaders(headers) });
  const fail = (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "Something went wrong";
    return data({ message, failed: true }, { headers: mergeHeaders(headers) });
  };

  try {
    switch (intent) {
      case "event-save": {
        const payload = eventPayload(form);
        if (!payload.name || !payload.slug) return ok("", { message: "A name and a URL slug are required.", failed: true });
        const saved = await saveEvent(supabase, str(form, "id") || undefined, payload);
        throw redirect(`/admin?tab=events&event=${saved.id}`, { headers: mergeHeaders(headers) });
      }
      case "event-urls": {
        const id = str(form, "id");
        if (!id) return ok("Save the event first.", { failed: true });
        await saveEvent(supabase, id, {
          poster_url: str(form, "poster_url"),
          cover_url: str(form, "cover_url"),
          banner_url: str(form, "banner_url"),
        });
        return ok("Saved ✓");
      }
      case "event-delete": {
        await deleteEvent(supabase, str(form, "id"));
        throw redirect("/admin?tab=events", { headers: mergeHeaders(headers) });
      }
      case "round-add": {
        const eventId = str(form, "event_id");
        const detail = await loadEventDetail(supabase, eventId);
        await addRound(supabase, eventId, str(form, "round_label") || `Round ${detail.rounds.length + 1}`, detail.rounds);
        return ok("Round added");
      }
      case "round-rename": {
        const label = str(form, "label");
        if (!label) return ok("Give the round a name.", { failed: true });
        await renameRound(supabase, str(form, "id"), label);
        return ok("Renamed ✓");
      }
      case "round-delete": {
        await deleteRound(supabase, str(form, "id"));
        return ok("Round deleted");
      }
      case "round-move": {
        const eventId = str(form, "event_id");
        const detail = await loadEventDetail(supabase, eventId);
        await swapPositions(supabase, "rounds", detail.rounds, str(form, "id"), Number(str(form, "dir")));
        return ok("");
      }
      case "bulk-append":
      case "bulk-replace": {
        const parsed = parseSongLines(str(form, "bulk"));
        if (!parsed.length) return ok("Paste some songs first.", { failed: true });
        const roundId = str(form, "round_id");
        if (intent === "bulk-replace") await replaceRoundSongs(supabase, roundId);
        const ensured = await ensureSongs(supabase, parsed);
        const existing = intent === "bulk-replace" ? [] : await loadRoundSongs(supabase, roundId);
        const added = await addSongsToRound(
          supabase,
          roundId,
          ensured.songs.map((song) => song.id),
          existing,
        );
        return ok(`Added ${added} songs ✓`);
      }
      case "rs-move": {
        const existing = await loadRoundSongs(supabase, str(form, "round_id"));
        await swapPositions(supabase, "round_songs", existing, str(form, "id"), Number(str(form, "dir")));
        return ok("");
      }
      case "rs-remove": {
        await removeRoundSong(supabase, str(form, "id"));
        return ok("");
      }
      case "pick-song": {
        const existing = await loadRoundSongs(supabase, str(form, "round_id"));
        await addSongsToRound(supabase, str(form, "round_id"), [str(form, "song_id")], existing);
        return ok("Added 1 songs ✓");
      }
      case "song-add": {
        const title = str(form, "new_title");
        if (!title) return ok("Add a song title.", { failed: true });
        await addSong(supabase, title, str(form, "new_artist"));
        return ok("Song added ✓");
      }
      case "song-delete": {
        await deleteSong(supabase, str(form, "id"));
        return ok("Deleted");
      }
      case "song-edit": {
        const part = str(form, "part");
        await updateSong(supabase, str(form, "id"), { [part]: str(form, "value") });
        return ok("Saved ✓");
      }
      case "songs-import": {
        const parsed = parseSongLines(str(form, "bulk_songs"));
        if (!parsed.length) return ok("Nothing to import.", { failed: true });
        const result = await ensureSongs(supabase, parsed);
        return ok(`Added ${result.added} new songs ✓`);
      }
      case "faq-add": {
        await addFaq(supabase, await listFaqs(supabase));
        return ok("");
      }
      case "faq-move": {
        const faqs = await listFaqs(supabase);
        await swapPositions(supabase, "faqs", faqs, str(form, "id"), Number(str(form, "dir")));
        return ok("");
      }
      case "faq-delete": {
        await deleteFaq(supabase, str(form, "id"));
        return ok("Deleted");
      }
      case "faq-edit": {
        const part = str(form, "part");
        await updateFaq(supabase, str(form, "id"), { [part]: str(form, "value") });
        return ok("Saved ✓");
      }
      case "request-delete": {
        await deleteRequest(supabase, str(form, "id"));
        return ok("");
      }
      case "settings-save": {
        await saveSettings(supabase, {
          instagram: str(form, "instagram"),
          facebook: str(form, "facebook"),
        });
        return ok("Saved ✓");
      }
      case "photo-move": {
        const detail = await loadEventDetail(supabase, str(form, "event_id"));
        await swapPositions(supabase, "photos", detail.photos, str(form, "id"), Number(str(form, "dir")));
        return ok("");
      }
      case "photo-delete": {
        await deletePhoto(supabase, str(form, "id"));
        return ok("Removed");
      }
      case "photo-alt": {
        await updatePhotoAlt(supabase, str(form, "id"), str(form, "alt"));
        return ok("Saved ✓");
      }
      case "upload-image": {
        const file = form.get("file");
        if (!(file instanceof File) || !file.size) return ok("Choose a file.", { failed: true });
        const url = await uploadFile(supabase, file, "events");
        return ok("Uploaded — now press Save event", { url, target: str(form, "target") });
      }
      case "upload-photos": {
        const eventId = str(form, "event_id");
        const file = form.get("file");
        if (!(file instanceof File) || !file.size) return ok("Choose a photo.", { failed: true });
        const url = await uploadFile(supabase, file, "gallery");
        const detail = await loadEventDetail(supabase, eventId);
        await addPhotos(supabase, eventId, [url], detail.photos);
        return ok("Uploaded ✓");
      }
      default:
        return ok("Unknown action.", { failed: true });
    }
  } catch (error) {
    if (error instanceof Response) throw error;
    return fail(error);
  }
}

export default function Admin({ loaderData, actionData }: Route.ComponentProps) {
  const flash = actionData as { message?: string; failed?: boolean; error?: string } | undefined;

  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => document.body.classList.remove("admin-body");
  }, []);

  if (loaderData.status === "unconfigured") {
    return (
      <div className="admin-body">
        <div className="admin-shell">
          <div className="admin-bar">
            <a className="admin-bar__brand" href="/" aria-label="DA'QTAD admin">
              <BrandLogo className="brand-logo brand-logo--admin" />
              <span className="admin-bar__brand-label">admin</span>
            </a>
          </div>
          <div className="admin-banner admin-banner--warn">
            <strong>The database is not connected yet.</strong>
            <br />
            Set <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> in <code>.env</code> (and in Netlify env
            vars), then reload. The full walkthrough is in <code>README.md</code>.
          </div>
          <div className="admin-card">
            <h2>Setup, in short</h2>
            <ol className="admin-hint">
              <li>Create a free project at supabase.com.</li>
              <li>
                SQL Editor → run <code>supabase/schema.sql</code>, then <code>supabase/seed.sql</code>.
              </li>
              <li>Authentication → Users → add yourself, then run the last query in the README.</li>
              <li>Project Settings → API keys → copy the URL and publishable key into <code>.env</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (loaderData.status === "anon" || loaderData.status === "not-admin") {
    const email = loaderData.status === "not-admin" ? loaderData.email : "";
    return (
      <div className="admin-body">
        <div className="admin-shell">
          <div className="admin-bar">
            <a className="admin-bar__brand" href="/" aria-label="DA'QTAD admin">
              <BrandLogo className="brand-logo brand-logo--admin" />
              <span className="admin-bar__brand-label">admin</span>
            </a>
          </div>
          {loaderData.status === "not-admin" ? (
            <div className="admin-banner admin-banner--warn">
              <strong>Signed in, but this account is not an admin yet.</strong>
              <br />
              In the Supabase SQL editor, run:
              <br />
              <code>
                insert into public.admins (user_id, email) select id, email from auth.users where email = '{email}';
              </code>
              <br />
              Then reload this page.
            </div>
          ) : (
            <div className="admin-login">
              <div className="admin-card">
                <h2 className="h2">Sign in</h2>
                <p className="admin-hint">Use the email and password you created in Supabase → Authentication → Users.</p>
                <Status message={flash?.error || loaderData.error} failed />
                <form method="post">
                  <div className="admin-grid">
                    <Field label="Email" name="email" type="email" />
                    <Field label="Password" name="password" type="password" />
                  </div>
                  <div className="admin-actions">
                    <button className="btn btn--primary" type="submit" name="intent" value="login">
                      Sign in →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const {
    email,
    tab,
    events,
    songs,
    faqs,
    settings,
    requests,
    requestsFor,
    event,
    rounds,
    photos,
    round,
    roundSongs,
  } = loaderData as {
    email: string;
    tab: string;
    events: AdminEvent[];
    songs: AdminSong[];
    faqs: AdminFaq[];
    settings: AdminSettings;
    requests: AdminRequestRow[];
    requestsFor: string;
    event: Partial<AdminEvent> | null;
    rounds: AdminRound[];
    photos: AdminPhoto[];
    round: AdminRound | null;
    roundSongs: AdminRoundSong[];
  };

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <div className="admin-bar">
          <a className="admin-bar__brand" href="/" aria-label="DA'QTAD admin">
            <BrandLogo className="brand-logo brand-logo--admin" />
            <span className="admin-bar__brand-label">admin</span>
          </a>
          <div className="admin-bar__right">
            <span>{email}</span>
            <a className="btn btn--xs btn--ghost" href="/">
              View site ↗
            </a>
            <form method="post">
              <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="logout">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <Status message={flash?.message} failed={flash?.failed} />
        <AdminTabs tab={tab} />
        {round && event?.id ? (
          <RoundEditor eventId={event.id} round={round} roundSongs={roundSongs} songs={songs} />
        ) : event ? (
          <EventEditor event={event} rounds={rounds} photos={photos} />
        ) : tab === "songs" ? (
          <SongsTab songs={songs} />
        ) : tab === "faqs" ? (
          <FaqsTab faqs={faqs} />
        ) : tab === "requests" ? (
          <RequestsTab events={events} requests={requests} requestsFor={requestsFor} />
        ) : tab === "settings" ? (
          <SettingsTab settings={settings} />
        ) : (
          <EventsTab events={events} />
        )}
      </div>
    </div>
  );
}
