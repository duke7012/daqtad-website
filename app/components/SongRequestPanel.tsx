import { Form, useActionData, useNavigation } from "react-router";
import { safeHref } from "~/lib/urls";
import type { EventItem, SongRequest } from "~/types";

export function SongRequestPanel({
  event,
  requests,
  note,
}: {
  event: EventItem;
  requests: SongRequest[];
  note: string;
}) {
  const actionData = useActionData<{ message?: string; failed?: boolean }>();
  const navigation = useNavigation();
  const sending = navigation.state === "submitting";

  return (
    <div className="panel">
      <div className="panel__col">
        <h2 className="h2">Request a song 🎵</h2>
        <p className="panel__note">{note}</p>
        {!event.requestsOpen ? (
          <div className="notice">Song requests are closed for this event 💜 See you on the dance floor!</div>
        ) : (
          <Form className="form" method="post" id="request-form">
            <label className="visually-hidden" htmlFor="req-song">
              Song title
            </label>
            <input id="req-song" name="song" type="text" placeholder="Song title" required />
            <label className="visually-hidden" htmlFor="req-artist">
              Artist or group
            </label>
            <input id="req-artist" name="artist" type="text" placeholder="Artist / group" />
            <label className="visually-hidden" htmlFor="req-time">
              Which part of the song
            </label>
            <input
              id="req-time"
              name="time"
              type="text"
              placeholder="Timestamp - which part? (e.g. 1:05–1:35, chorus)"
            />
            <label className="visually-hidden" htmlFor="req-link">
              Reference link
            </label>
            <input
              id="req-link"
              name="link"
              type="url"
              placeholder="Link - dance practice video preferred (optional)"
            />
            <button className="btn btn--primary" type="submit" disabled={sending}>
              {sending ? "Sending…" : "Send request →"}
            </button>
            <p className="form__status" role="status" aria-live="polite" {...(actionData?.failed ? { "data-error": "" } : {})}>
              {actionData?.message || ""}
            </p>
          </Form>
        )}
      </div>
      <div className="panel__col">
        <h3 className="h3">
          Requested so far <span className="count-badge">{requests.length}</span>
        </h3>
        {!requests.length ? (
          <div className="notice notice--plain">No requests yet - be the first! ✨</div>
        ) : (
          <div className="request-list">
            {requests.map((req, i) => {
              const href = safeHref(req.link);
              const link = /^https?:\/\//i.test(href) ? href : "";
              return (
                <div className="request" key={`${req.song}-${i}`}>
                  <div className="request__top">
                    <div>
                      <span className="request__song">{req.song}</span>{" "}
                      <span className="request__artist">- {req.artist}</span>
                    </div>
                  </div>
                  <div className="request__meta">
                    <span>⏱ {req.time || "any part"}</span>
                    {link ? (
                      <a href={link} target="_blank" rel="noopener">
                        ▶ dance practice ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
