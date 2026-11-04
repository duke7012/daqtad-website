import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Form, useFetcher } from "react-router";
import { safeHref } from "~/lib/urls";
import type { AdminEvent } from "~/types";

type Drag = {
  id: string;
  pointerId: number;
  /** Where in the row the pointer grabbed it, from the row's top edge. */
  grabOffset: number;
  /** Order before the drag started, to restore on cancel and to skip no-op saves. */
  startOrder: string[];
};

/** Distance from the window edge where dragging starts scrolling the page. */
const EDGE = 64;

function sameOrder(a: string[], b: string[]) {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export function EventsTab({ events }: { events: AdminEvent[] }) {
  const fetcher = useFetcher<{ message?: string; failed?: boolean }>();
  const serverOrder = events.map((ev) => ev.id);
  const serverKey = serverOrder.join(",");

  const [order, setOrder] = useState(serverOrder);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [dragY, setDragY] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const keyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  // Follow the server's order whenever it changes (after a save, a delete, a new event),
  // unless a drag is in progress.
  useEffect(() => {
    if (!drag) setOrder(serverKey ? serverKey.split(",") : []);
  }, [serverKey]);

  // A failed save leaves the server order unchanged, so put the list back by hand.
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.failed) setOrder(serverKey ? serverKey.split(",") : []);
  }, [fetcher.state, fetcher.data]);

  const byId = new Map(events.map((ev) => [ev.id, ev]));
  const rows = order.map((id) => byId.get(id)).filter((ev): ev is AdminEvent => !!ev);

  function save(next: string[]) {
    fetcher.submit({ intent: "event-reorder", ids: JSON.stringify(next) }, { method: "post" });
  }

  /** Pointer position relative to the top of the list. */
  function listY(clientY: number) {
    return clientY - (listRef.current?.getBoundingClientRect().top ?? 0);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (e.button !== 0 || drag) return;
    const row = rowRefs.current.get(id);
    if (!row) return;
    e.preventDefault();
    try {
      // Keep receiving moves even when the pointer leaves the small handle.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      return;
    }
    setDrag({ id, pointerId: e.pointerId, grabOffset: listY(e.clientY) - row.offsetTop, startOrder: order });
    setDragY(0);
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const row = rowRefs.current.get(drag.id);
    if (!row) return;

    if (e.clientY < EDGE) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - EDGE) window.scrollBy(0, 12);

    // Where the dragged row's top edge would be if it followed the pointer exactly.
    const top = listY(e.clientY) - drag.grabOffset;
    const middle = top + row.offsetHeight / 2;

    // Step past neighbours whose middle the dragged row has crossed.
    let next = order;
    let index = next.indexOf(drag.id);
    for (;;) {
      const above = index > 0 ? rowRefs.current.get(next[index - 1]) : undefined;
      const below = index < next.length - 1 ? rowRefs.current.get(next[index + 1]) : undefined;
      if (above && middle < above.offsetTop + above.offsetHeight / 2) {
        next = next.slice();
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
        index -= 1;
      } else if (below && middle > below.offsetTop + below.offsetHeight / 2) {
        next = next.slice();
        [next[index + 1], next[index]] = [next[index], next[index + 1]];
        index += 1;
      } else {
        break;
      }
    }
    if (next !== order) setOrder(next);

    // Rows keep their offsetTop from layout (transforms don't change it), so the slot the
    // dragged row sits in after this move is: slot of the row now above it + its height + gap.
    const gap = 8;
    let slotTop = 0;
    for (const id of next) {
      if (id === drag.id) break;
      const el = rowRefs.current.get(id);
      if (el) slotTop += el.offsetHeight + gap;
    }
    setDragY(top - slotTop);
  }

  function endDrag(e: PointerEvent<HTMLButtonElement>, cancelled: boolean) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const start = drag.startOrder;
    setDrag(null);
    setDragY(0);
    if (cancelled) {
      setOrder(start);
    } else if (!sameOrder(order, start)) {
      save(order);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const index = order.indexOf(id);
    const other = index + (e.key === "ArrowUp" ? -1 : 1);
    if (index < 0 || other < 0 || other >= order.length) return;
    const next = order.slice();
    [next[index], next[other]] = [next[other], next[index]];
    setOrder(next);
    // Wait for a short pause so a run of key presses saves once, with the final order.
    clearTimeout(keyTimer.current);
    keyTimer.current = setTimeout(() => save(next), 500);
  }

  useEffect(() => () => clearTimeout(keyTimer.current), []);

  const saving = fetcher.state !== "idle";
  const status = saving ? "Saving order…" : fetcher.data?.message || "";

  return (
    <div className="admin-card">
      <div className="admin-head">
        <h2>Events</h2>
        <a className="btn btn--xs btn--primary" href="/admin?tab=events&event=new">
          + New event
        </a>
      </div>
      {events.length > 1 ? (
        <p className="admin-hint" id="event-sort-hint">
          Events show on the Events page in this order. Drag a row by its ⠿ handle to move it, or focus the handle and
          press ↑ / ↓.
          <span className={`event-sort__status${fetcher.data?.failed ? " is-error" : ""}`} role="status" aria-live="polite">
            {status ? ` ${status}` : ""}
          </span>
        </p>
      ) : null}
      {!events.length ? (
        <div className="admin-empty">No events yet. Add your first one.</div>
      ) : (
        <div className={`event-sort${drag ? " is-sorting" : ""}`} ref={listRef}>
          {rows.map((ev, index) => {
            const when = ev.starts_at
              ? new Date(ev.starts_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  timeZone: ev.timezone || "UTC",
                })
              : "no date";
            const page = safeHref(ev.page || "") || `/events/${encodeURIComponent(ev.slug)}`;
            const dragging = drag?.id === ev.id;
            return (
              <div
                className={`admin-row admin-row--sortable${dragging ? " is-dragging" : ""}`}
                key={ev.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(ev.id, el);
                  else rowRefs.current.delete(ev.id);
                }}
                style={dragging ? { transform: `translateY(${dragY}px)` } : undefined}
              >
                {events.length > 1 ? (
                  <button
                    type="button"
                    className="drag-handle"
                    aria-label={`Reorder "${ev.name}", position ${index + 1} of ${rows.length}`}
                    aria-describedby="event-sort-hint"
                    title="Drag to reorder"
                    onPointerDown={(e) => onPointerDown(e, ev.id)}
                    onPointerMove={onPointerMove}
                    onPointerUp={(e) => endDrag(e, false)}
                    onPointerCancel={(e) => endDrag(e, true)}
                    onKeyDown={(e) => onKeyDown(e, ev.id)}
                  >
                    ⠿
                  </button>
                ) : null}
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
          })}
        </div>
      )}
    </div>
  );
}
