import { Form } from "react-router";
import { safeHref } from "~/lib/urls";
import type { AdminEvent, AdminRequestRow } from "~/types";

export function RequestsTab({
  events,
  requests,
  requestsFor,
}: {
  events: AdminEvent[];
  requests: AdminRequestRow[];
  requestsFor: string;
}) {
  return (
    <div className="admin-card">
      <div className="admin-head">
        <h2>Song requests</h2>
        <span className="admin-hint" style={{ margin: 0 }}>
          {requests.length} total
        </span>
      </div>
      <label className="admin-field" style={{ maxWidth: 320 }}>
        <span>Event</span>
        <Form method="get">
          <input type="hidden" name="tab" value="requests" />
          <select
            name="requestsFor"
            defaultValue={requestsFor}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </select>
        </Form>
      </label>
      <div style={{ marginTop: 16 }}>
        {!requests.length ? (
          <div className="admin-empty">No requests for this event yet.</div>
        ) : (
          requests.map((req) => {
            const href = safeHref(req.link || "");
            const link = /^https?:\/\//i.test(href);
            return (
              <div className="admin-row" key={req.id}>
                <div className="admin-row__main">
                  <div className="admin-row__title">
                    {req.song}
                    {req.artist ? (
                      <span className="admin-row__meta" style={{ display: "inline" }}>
                        {" "}
                        - {req.artist}
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-row__meta">
                    {req.part || "any part"}
                    {link ? (
                      <>
                        {" "}
                        ·{" "}
                        <a href={href} target="_blank" rel="noopener">
                          link ↗
                        </a>
                      </>
                    ) : req.link ? (
                      ` · ${req.link}`
                    ) : null}
                  </div>
                </div>
                <div className="admin-row__actions">
                  <Form method="post">
                    <input type="hidden" name="id" value={req.id} />
                    <button className="btn btn--xs btn--danger" type="submit" name="intent" value="request-delete">
                      Delete
                    </button>
                  </Form>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
