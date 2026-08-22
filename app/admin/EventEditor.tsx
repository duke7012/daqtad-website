import { Form, useFetcher } from "react-router";
import { Checkbox, Field } from "~/admin/fields";
import { TIMEZONES, fromIso } from "~/lib/admin-utils";
import { rooted } from "~/lib/urls";
import type { AdminEvent, AdminPhoto, AdminRound } from "~/types";

function UploadField({
  label,
  target,
}: {
  label: string;
  target: string;
}) {
  const fetcher = useFetcher<{ url?: string; message?: string }>();

  return (
    <label className="admin-field">
      <span>{label}</span>
      <fetcher.Form method="post" encType="multipart/form-data">
        <input type="hidden" name="intent" value="upload-image" />
        <input type="hidden" name="target" value={target} />
        <input
          type="file"
          name="file"
          accept="image/*"
          onChange={(event) => {
            if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
          }}
        />
      </fetcher.Form>
      {fetcher.data?.url ? <small>Uploaded: {fetcher.data.url}</small> : null}
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
  const photoFetcher = useFetcher();

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
            hint=" — lowercase, no spaces"
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
            hint=" — pill on the events page"
            placeholder="Upcoming · requests open"
          />
          <Field label="Link text" name="cta" defaultValue={event.cta || ""} placeholder="Photos · video · setlist →" />
          <Field label="Stats line" name="stats" defaultValue={event.stats || ""} placeholder="~60 dancers · 3 hours" />
          <Field
            label="Videos"
            name="video"
            defaultValue={event.video || ""}
            type="textarea"
            hint=" — one YouTube link or ID per line"
          />
          <Field
            label="Sort order"
            name="position"
            defaultValue={event.position || 0}
            type="number"
            hint=" — higher shows first"
          />
          <Field
            label="Custom page"
            name="page"
            defaultValue={event.page || ""}
            hint={` — leave blank to use /events/${event.slug || "the-slug"}`}
            placeholder="/events/popup"
          />
          <Field
            label="Google Drive"
            name="drive_url"
            defaultValue={event.drive_url || ""}
            type="url"
            hint=" — optional album for this event only"
            placeholder="https://drive.google.com/drive/folders/…"
          />
        </div>
        <div className="admin-actions">
          <Checkbox label="Song requests are open" name="requests_open" defaultChecked={!!event.requests_open} />
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
          Upload an image or paste a link. The poster is the tall image on the events page; the cover is the wide one on
          the home page.
        </p>
        <Form method="post">
          <input type="hidden" name="id" value={event.id || ""} />
          <input type="hidden" name="intent" value="event-urls" />
          <div className="admin-grid">
            <Field label="Poster URL" name="poster_url" defaultValue={event.poster_url || ""} />
            <Field label="Cover URL" name="cover_url" defaultValue={event.cover_url || ""} />
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
        </div>
        <p className="admin-hint">Uploading fills the URL box — then press <strong>Save image URLs</strong>.</p>
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
            <photoFetcher.Form method="post" encType="multipart/form-data" className="admin-actions">
              <input type="hidden" name="intent" value="upload-photos" />
              <input type="hidden" name="event_id" value={event.id} />
              <label className="admin-field">
                <span>Upload photos</span>
                <input
                  type="file"
                  name="files"
                  accept="image/*"
                  multiple
                  onChange={(event) => {
                    if (event.currentTarget.files?.length) event.currentTarget.form?.requestSubmit();
                  }}
                />
              </label>
            </photoFetcher.Form>
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
