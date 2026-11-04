import { Form } from "react-router";
import { safeHref } from "~/lib/urls";
import type { AdminEvent } from "~/types";

export function EventsTab({ events }: { events: AdminEvent[] }) {
  return (
    <div className="admin-card">
      <div className="admin-head">
        <h2>Events</h2>
        <a className="btn btn--xs btn--primary" href="/admin?tab=events&event=new">
          + New event
        </a>
      </div>
      {events.length > 1 ? (
        <p className="admin-hint">Events show on the Events page in this order. Use ↑ and ↓ to rearrange them.</p>
      ) : null}
      {!events.length ? (
        <div className="admin-empty">No events yet. Add your first one.</div>
      ) : (
        events.map((ev, index) => {
          const when = ev.starts_at
            ? new Date(ev.starts_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: ev.timezone || "UTC",
              })
            : "no date";
          const page = safeHref(ev.page || "") || `/events/${encodeURIComponent(ev.slug)}`;
          return (
            <div className="admin-row" key={ev.id}>
              <div className="admin-row__main">
                <div className="admin-row__title">
                  {ev.name}
                  {ev.subtitle ? ` - ${ev.subtitle}` : ""}
                </div>
                <div className="admin-row__meta">
                  {ev.status} · {when} · /{ev.slug}
                </div>
              </div>
              <div className="admin-row__actions">
                <Form method="post">
                  <input type="hidden" name="id" value={ev.id} />
                  <input type="hidden" name="dir" value="-1" />
                  <button
                    className="btn btn--xs btn--ghost"
                    type="submit"
                    name="intent"
                    value="event-move"
                    disabled={index === 0}
                    aria-label={`Move "${ev.name}" up`}
                    title="Move up"
                  >
                    ↑
                  </button>
                </Form>
                <Form method="post">
                  <input type="hidden" name="id" value={ev.id} />
                  <input type="hidden" name="dir" value="1" />
                  <button
                    className="btn btn--xs btn--ghost"
                    type="submit"
                    name="intent"
                    value="event-move"
                    disabled={index === events.length - 1}
                    aria-label={`Move "${ev.name}" down`}
                    title="Move down"
                  >
                    ↓
                  </button>
                </Form>
                <a className="btn btn--xs btn--ghost" href={page} target="_blank" rel="noopener">
                  Open ↗
                </a>
                <a className="btn btn--xs btn--primary" href={`/admin?tab=events&event=${ev.id}`}>
                  Edit
                </a>
                <Form method="post">
                  <input type="hidden" name="id" value={ev.id} />
                  <input type="hidden" name="name" value={ev.name} />
                  <button
                    className="btn btn--xs btn--danger"
                    type="submit"
                    name="intent"
                    value="event-delete"
                    onClick={(event) => {
                      if (!window.confirm(`Delete "${ev.name}" with all its rounds and photos? This cannot be undone.`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    Delete
                  </button>
                </Form>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
