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
      {!events.length ? (
        <div className="admin-empty">No events yet. Add your first one.</div>
      ) : (
        events.map((ev) => {
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
