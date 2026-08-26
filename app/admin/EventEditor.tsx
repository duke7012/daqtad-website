import { useEffect, useRef, useState } from "react";
import { Form, useFetcher, useRevalidator } from "react-router";
import { PageSectionsEditor } from "~/admin/PageSectionsEditor";
import { Checkbox, Field } from "~/admin/fields";
import { TIMEZONES, fromIso } from "~/lib/admin-utils";
import { compressImageIfNeeded } from "~/lib/compress-image";
import { rooted } from "~/lib/urls";
import type { AdminEvent, AdminPhoto, AdminRound } from "~/types";

function PhotoUploadField({ eventId }: { eventId: string }) {
  const fetcher = useFetcher<{ message?: string; failed?: boolean }>();
  const revalidator = useRevalidator();
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]);
  const indexRef = useRef(0);
  const waitingRef = useRef(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [status, setStatus] = useState("");
  const [phase, setPhase] = useState<"idle" | "compressing" | "uploading">("idle");

  async function submitCurrent() {
    const original = filesRef.current[indexRef.current];
    if (!original) return;
    setProgress({ current: indexRef.current + 1, total: filesRef.current.length });
    try {
      setPhase("compressing");
      const file = await compressImageIfNeeded(original);
      setPhase("uploading");
      waitingRef.current = true;
      const formData = new FormData();
      formData.set("intent", "upload-photos");
      formData.set("event_id", eventId);
      formData.set("file", file);
      fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
    } catch (error) {
      waitingRef.current = false;
      setPhase("idle");
      setStatus(error instanceof Error ? error.message : "Compression failed.");
      setProgress(null);
      filesRef.current = [];
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  useEffect(() => {
    if (!waitingRef.current || fetcher.state !== "idle" || !fetcher.data) return;
    waitingRef.current = false;

    if (fetcher.data.failed) {
      setStatus(fetcher.data.message || "Upload failed.");
      setPhase("idle");
      setProgress(null);
      filesRef.current = [];
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    indexRef.current += 1;
    if (indexRef.current < filesRef.current.length) {
      void submitCurrent();
      return;
    }

    const count = filesRef.current.length;
    setStatus(`Uploaded ${count} photo${count === 1 ? "" : "s"} ✓`);
    setPhase("idle");
    setProgress(null);
    filesRef.current = [];
    if (inputRef.current) inputRef.current.value = "";
    revalidator.revalidate();
  }, [fetcher.state, fetcher.data, eventId, revalidator]);

  const busy = phase !== "idle" || fetcher.state !== "idle";

  return (
    <div className="admin-actions">
      <label className="admin-field">
        <span>
          Upload photos
          <small> - large files are compressed automatically</small>
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={(event) => {
            const list = Array.from(event.currentTarget.files || []);
            if (!list.length || busy) return;
            filesRef.current = list;
            indexRef.current = 0;
            setStatus("");
            void submitCurrent();
          }}
        />
      </label>
      {progress ? (
        <p className="admin-hint">
          {phase === "compressing" ? "Compressing" : "Uploading"} {progress.current} of {progress.total}…
        </p>
      ) : null}
      {!progress && status ? <p className="admin-hint">{status}</p> : null}
    </div>
  );
}

function UploadField({
  label,
  target,
}: {
  label: string;
  target: string;
}) {
  const fetcher = useFetcher<{ url?: string; message?: string }>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = fetcher.data?.url;
    if (!url) return;
    const input = document.querySelector<HTMLInputElement>(`input[name="${target}"]`);
    if (input) input.value = url;
  }, [fetcher.data, target]);

  return (
    <label className="admin-field">
      <span>
        {label}
        <small> - large files are compressed automatically</small>
      </span>
      <input
        type="file"
        accept="image/*"
        disabled={busy || fetcher.state !== "idle"}
        onChange={async (event) => {
          const original = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!original) return;
          setBusy(true);
          try {
            const file = await compressImageIfNeeded(original);
            const formData = new FormData();
            formData.set("intent", "upload-image");
            formData.set("target", target);
            formData.set("file", file);
            fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
          } catch (error) {
            window.alert(error instanceof Error ? error.message : "Compression failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy ? <small>Compressing…</small> : null}
      {!busy && fetcher.data?.url ? <small>Uploaded - press Save image URLs</small> : null}
    </label>
  );
}

export function EventEditor({
  event,
  rounds,
  photos,
}: {
  event: Partial<AdminEvent>;
  rounds: AdminRound[];
  photos: AdminPhoto[];
}) {
  const zone = event.timezone || "America/Denver";
  const start = fromIso(event.starts_at, zone);
  const end = fromIso(event.ends_at, zone);
  return (
    <>
      <Form method="post" className="admin-card">
        <input type="hidden" name="id" value={event.id || ""} />
        <div className="admin-head">
          <h2>{event.id ? event.name || "Edit event" : "New event"}</h2>
          <a className="btn btn--xs btn--ghost" href="/admin?tab=events">
            ← Back to events
          </a>
        </div>
        <div className="admin-grid">
          <Field label="Name" name="name" defaultValue={event.name || ""} placeholder="#RDD9" />
          <Field label="Subtitle" name="subtitle" defaultValue={event.subtitle || ""} placeholder="Bopsim Korean Festival" />
          <Field
            label="URL slug"
            name="slug"
            defaultValue={event.slug || ""}
            hint=" - lowercase, no spaces"
            placeholder="rdd-9"
          />
          <Field
            label="Status"
            name="status"
            defaultValue={event.status || "upcoming"}
            type="select"
            choices={["upcoming", "past"]}
          />
          <Field label="Date" name="date" defaultValue={start.date} type="date" />
          <Field label="Start time" name="start_time" defaultValue={start.time} type="time" />
          <Field label="End time" name="end_time" defaultValue={end.time} type="time" />
          <Field label="Timezone" name="timezone" defaultValue={zone} type="select" choices={TIMEZONES} />
          <Field label="Venue" name="venue" defaultValue={event.venue || ""} placeholder="Liberty Park, Salt Lake City, UT" />
          <Field label="Venue (short)" name="venue_short" defaultValue={event.venue_short || ""} placeholder="Liberty Park, SLC" />
          <Field
            label="Badge"
            name="badge"
            defaultValue={event.badge || ""}
            hint=" - pill on the events page"
            placeholder="Upcoming · requests open"
          />
          <Field label="Link text" name="cta" defaultValue={event.cta || ""} placeholder="Photos · video · setlist →" />
          <Field label="Stats line" name="stats" defaultValue={event.stats || ""} placeholder="~60 dancers · 3 hours" />
          <Field
            label="Videos"
            name="video"
            defaultValue={event.video || ""}
            type="textarea"
            hint=" - one YouTube link or ID per line"
          />
          <Field
            label="Instagram posts"
            name="instagram_posts"
            defaultValue={event.instagram_posts || ""}
            type="textarea"
            hint=" - one post URL per line; add “ | caption” to override the hover text"
          />
          <Field
            label="Sort order"
            name="position"
            defaultValue={event.position || 0}
            type="number"
            hint=" - higher shows first"
          />
          <Field
            label="Custom page"
            name="page"
            defaultValue={event.page || ""}
            hint={` - leave blank to use /events/${event.slug || "the-slug"}`}
            placeholder="/events/popup"
          />
        </div>
        <div className="admin-card admin-card--nested">
          <h3 className="h3">Hero buttons</h3>
          <p className="admin-hint">
            Links shown under the countdown on this event&apos;s page. Leave Instagram or Facebook blank to use the
            site defaults from Settings. YouTube can use a custom URL or the first video from the Videos field.
          </p>
          <div className="admin-grid">
            <Field
              label="Instagram URL"
              name="instagram_url"
              defaultValue={event.instagram_url || ""}
              type="url"
              hint=" - optional override"
              placeholder="https://instagram.com/…"
            />
            <Field
              label="Facebook / photo album URL"
              name="facebook_url"
              defaultValue={event.facebook_url || ""}
              type="url"
              hint=" - optional override"
              placeholder="https://facebook.com/…"
            />
            <Field
              label="YouTube URL"
              name="youtube_url"
              defaultValue={event.youtube_url || ""}
              type="url"
              hint=" - channel or video link"
              placeholder="https://youtube.com/…"
            />
            <Field
              label="Google Drive"
              name="drive_url"
              defaultValue={event.drive_url || ""}
              type="url"
              hint=" - optional photo album"
              placeholder="https://drive.google.com/drive/folders/…"
            />
          </div>
          <div className="admin-actions">
            <Checkbox label="Show Instagram" name="show_instagram" defaultChecked={event.show_instagram !== false} />
            <Checkbox label="Show photo album" name="show_facebook" defaultChecked={event.show_facebook !== false} />
            <Checkbox label="Show YouTube" name="show_youtube" defaultChecked={!!event.show_youtube} />
            <Checkbox label="Show photo drive" name="show_drive" defaultChecked={event.show_drive !== false} />
          </div>
        </div>
        <div className="admin-actions">
          <Checkbox label="Song requests are open" name="requests_open" defaultChecked={!!event.requests_open} />
        </div>
        <div className="admin-card admin-card--nested">
          <h3 className="h3">Page sections</h3>
          <p className="admin-hint">
            Choose which blocks appear on this event&apos;s page and in what order. The hero at the top is always
            shown.
          </p>
          <PageSectionsEditor
            name="page_sections"
            defaultValue={event.page_sections}
            status={event.status || "upcoming"}
          />
        </div>
        <div className="admin-actions">
          <button className="btn btn--primary" type="submit" name="intent" value="event-save">
            Save event
          </button>
          <a className="btn btn--xs btn--ghost" href="/admin?tab=events">
            Cancel
          </a>
        </div>
      </Form>

      <div className="admin-card">
        <h2 className="h2">Poster and cover</h2>
        <p className="admin-hint">
          Upload an image or paste a link. Poster = tall image on the event page. Cover = wide thumbnail on recent
          events. Up next background = home “Up next” card (separate from the cover).
        </p>
        <Form method="post">
          <input type="hidden" name="id" value={event.id || ""} />
          <input type="hidden" name="intent" value="event-urls" />
          <div className="admin-grid">
            <Field label="Poster URL" name="poster_url" defaultValue={event.poster_url || ""} />
            <Field label="Cover URL" name="cover_url" defaultValue={event.cover_url || ""} />
            <Field
              label="Up next background URL"
              name="banner_url"
              defaultValue={event.banner_url || ""}
              hint=" - only used on the home Up next card"
            />
          </div>
          <div className="admin-actions">
            <button className="btn btn--primary" type="submit">
              Save image URLs
            </button>
          </div>
        </Form>
        <div className="admin-grid" style={{ marginTop: 12 }}>
          <UploadField label="Upload poster" target="poster_url" />
          <UploadField label="Upload cover" target="cover_url" />
          <UploadField label="Upload Up next background" target="banner_url" />
        </div>
        <p className="admin-hint">Uploading fills the URL box - then press <strong>Save image URLs</strong>.</p>
      </div>

      {event.id ? (
        <>
          <div className="admin-card">
            <div className="admin-head">
              <h2>Rounds</h2>
            </div>
            <p className="admin-hint">Each round is one setlist. Open a round to paste or pick its songs.</p>
            {!rounds.length ? (
              <div className="admin-empty">No rounds yet.</div>
            ) : (
              rounds.map((round) => (
                <div className="admin-row" key={round.id}>
                  <div className="admin-row__main">
                    <div className="admin-row__title">{round.label}</div>
                    <div className="admin-row__meta">{round.count || 0} songs</div>
                  </div>
                  <div className="admin-row__actions">
                    <a
                      className="btn btn--xs btn--primary"
                      href={`/admin?tab=events&event=${event.id}&round=${round.id}`}
                    >
                      Edit songs
                    </a>
                    <Form method="post">
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="id" value={round.id} />
                      <input type="hidden" name="dir" value="-1" />
                      <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="round-move">
                        ↑
                      </button>
                    </Form>
                    <Form method="post">
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="id" value={round.id} />
                      <input type="hidden" name="dir" value="1" />
                      <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="round-move">
                        ↓
                      </button>
                    </Form>
                    <Form method="post">
                      <input type="hidden" name="event_id" value={event.id} />
                      <input type="hidden" name="id" value={round.id} />
                      <button
                        className="btn btn--xs btn--danger"
                        type="submit"
                        name="intent"
                        value="round-delete"
                        onClick={(e) => {
                          if (!window.confirm("Delete this round and its songs?")) e.preventDefault();
                        }}
                      >
                        Delete
                      </button>
                    </Form>
                  </div>
                </div>
              ))
            )}
            <Form method="post" className="admin-actions">
              <input type="hidden" name="event_id" value={event.id} />
              <input
                className="admin-input"
                type="text"
                name="round_label"
                placeholder="Round 1 · 6:00 PM"
                style={{ maxWidth: 280 }}
              />
              <button className="btn btn--primary btn--xs" type="submit" name="intent" value="round-add">
                + Add round
              </button>
            </Form>
          </div>

          <div className="admin-card">
            <div className="admin-head">
              <h2>Photos</h2>
            </div>
            <p className="admin-hint">These show on the gallery page and on this event's page.</p>
            {!photos.length ? (
              <div className="admin-empty">No photos yet.</div>
            ) : (
              <div className="admin-thumbs">
                {photos.map((photo) => (
                  <div className="admin-thumb" key={photo.id}>
                    <img src={rooted(photo.url)} alt="" />
                    <div className="admin-thumb__body">
                      <Form method="post">
                        <input type="hidden" name="intent" value="photo-alt" />
                        <input type="hidden" name="event_id" value={event.id} />
                        <input type="hidden" name="id" value={photo.id} />
                        <input
                          type="text"
                          name="alt"
                          defaultValue={photo.alt || ""}
                          placeholder="Describe the photo"
                          onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                        />
                      </Form>
                      <div className="admin-thumb__row">
                        <Form method="post">
                          <input type="hidden" name="event_id" value={event.id} />
                          <input type="hidden" name="id" value={photo.id} />
                          <input type="hidden" name="dir" value="-1" />
                          <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="photo-move">
                            ↑
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="event_id" value={event.id} />
                          <input type="hidden" name="id" value={photo.id} />
                          <input type="hidden" name="dir" value="1" />
                          <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="photo-move">
                            ↓
                          </button>
                        </Form>
                        <Form method="post">
                          <input type="hidden" name="event_id" value={event.id} />
                          <input type="hidden" name="id" value={photo.id} />
                          <button
                            className="btn btn--xs btn--danger"
                            type="submit"
                            name="intent"
                            value="photo-delete"
                            onClick={(e) => {
                              if (!window.confirm("Remove this photo?")) e.preventDefault();
                            }}
                          >
                            Delete
                          </button>
                        </Form>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <PhotoUploadField eventId={event.id!} />
          </div>
        </>
      ) : (
        <div className="admin-card">
          <p className="admin-hint">Save the event first, then rounds and photos can be added.</p>
        </div>
      )}
    </>
  );
}
