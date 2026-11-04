import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { Form, useFetcher } from "react-router";
import { safeHref } from "~/lib/urls";
import type { AdminEvent } from "~/types";

type Drag = {
  id: string;
  pointerId: number;
  /** Index the row started at, and the index it would land at if dropped now. */
  from: number;
  to: number;
  /** Where in the row the pointer grabbed it, from the row's top edge. */
  grabOffset: number;
  /** Row tops and heights measured when the drag started. The DOM order is left alone
   * until the drop (moving the held element would make the browser drop the touch),
   * so these stay valid for the whole drag. */
  tops: number[];
  heights: number[];
  gap: number;
  /** How far the dragged row is drawn from its own slot. */
  dy: number;
};

/** Distance from the window edge where dragging starts scrolling the page. */
const EDGE = 64;

export function EventsTab({ events }: { events: AdminEvent[] }) {
  const fetcher = useFetcher<{ message?: string; failed?: boolean }>();
  const serverOrder = events.map((ev) => ev.id);
  const serverKey = serverOrder.join(",");

  const [order, setOrder] = useState(serverOrder);
  const [drag, setDragState] = useState<Drag | null>(null);
  // Handlers read the drag from a ref so back-to-back events (pointerup, then
  // lostpointercapture) see the latest value and never finish a drag twice.
  const dragRef = useRef<Drag | null>(null);
  const lastClientY = useRef(0);
  const scrollFrame = useRef(0);
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

  function setDrag(next: Drag | null) {
    dragRef.current = next;
    setDragState(next);
  }

  /** Work out where the dragged row would land for this pointer position. */
  function track(clientY: number) {
    const d = dragRef.current;
    if (!d) return;
    const top = listY(clientY) - d.grabOffset;
    const middle = top + d.heights[d.from] / 2;
    const mid = (i: number) => d.tops[i] + d.heights[i] / 2;
    let to = d.from;
    while (to > 0 && middle < mid(to - 1)) to -= 1;
    if (to === d.from) {
      while (to < d.tops.length - 1 && middle > mid(to + 1)) to += 1;
    }
    setDrag({ ...d, to, dy: top - d.tops[d.from] });
  }

  /** While dragging near the top or bottom of the window, keep scrolling, even if the pointer holds still. */
  function autoScroll() {
    if (!dragRef.current) return;
    const y = lastClientY.current;
    const step =
      y < EDGE ? -Math.ceil((EDGE - y) / 4) : y > window.innerHeight - EDGE ? Math.ceil((y - (window.innerHeight - EDGE)) / 4) : 0;
    if (step) {
      window.scrollBy(0, step);
      track(y);
    }
    scrollFrame.current = requestAnimationFrame(autoScroll);
  }

  function finish(commit: boolean) {
    const d = dragRef.current;
    if (!d) return;
    cancelAnimationFrame(scrollFrame.current);
    setDrag(null);
    if (!commit || d.to === d.from) return;
    const next = order.slice();
    const [moved] = next.splice(d.from, 1);
    next.splice(d.to, 0, moved);
    setOrder(next);
    save(next);
  }

  useEffect(() => () => cancelAnimationFrame(scrollFrame.current), []);

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, id: string) {
    if (e.button !== 0 || dragRef.current) return;
    const from = order.indexOf(id);
    const rowEls = order.map((rowId) => rowRefs.current.get(rowId));
    if (from < 0 || rowEls.some((el) => !el)) return;
    const els = rowEls as HTMLDivElement[];
    e.preventDefault();
    try {
      // Keep receiving moves even when the pointer leaves the small handle.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      return;
    }
    const tops = els.map((el) => el.offsetTop);
    const heights = els.map((el) => el.offsetHeight);
    const gap = els.length > 1 ? Math.max(0, tops[1] - tops[0] - heights[0]) : 0;
    lastClientY.current = e.clientY;
    setDrag({ id, pointerId: e.pointerId, from, to: from, grabOffset: listY(e.clientY) - tops[from], tops, heights, gap, dy: 0 });
    scrollFrame.current = requestAnimationFrame(autoScroll);
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    lastClientY.current = e.clientY;
    track(e.clientY);
  }

  function onPointerEnd(e: PointerEvent<HTMLButtonElement>, commit: boolean) {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    finish(commit);
  }

  /** How far to draw each row from its slot while a drag is in progress. */
  function rowShift(index: number) {
    if (!drag) return 0;
    if (index === drag.from) return drag.dy;
    const room = drag.heights[drag.from] + drag.gap;
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -room;
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return room;
    return 0;
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, id: string) {
    if (e.key === "Escape" && dragRef.current) {
      e.preventDefault();
      finish(false);
      return;
    }
    if (dragRef.current || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
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
                style={drag ? { transform: `translateY(${rowShift(index)}px)` } : undefined}
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
                    onPointerUp={(e) => onPointerEnd(e, true)}
                    onPointerCancel={(e) => onPointerEnd(e, false)}
                    onLostPointerCapture={(e) => onPointerEnd(e, true)}
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
