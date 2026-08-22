import { useMemo, useState } from "react";
import { eventHref, padTo } from "~/lib/urls";
import type { EventItem } from "~/types";

const PREVIEW_SONGS = 12;

export function SetlistViewer({ event, mode }: { event: EventItem; mode: "preview" | "full" }) {
  const isFull = mode === "full";
  const [roundIndex, setRoundIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");

  const round = event.rounds[roundIndex];
  const all = useMemo(
    () => (round?.songs || []).map((song, i) => ({ n: i + 1, song: song[0], artist: song[1] })),
    [round],
  );
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((entry) => `${entry.song} ${entry.artist}`.toLowerCase().includes(q));
  }, [all, query]);

  if (!round) return null;

  const width = String(round.songs.length).length;
  const truncated = !isFull && !expanded && matches.length > PREVIEW_SONGS;
  const shown = truncated ? matches.slice(0, PREVIEW_SONGS) : matches;

  return (
    <div className={`setlist ${isFull ? "setlist--full" : "setlist--preview"}`}>
      <div className="setlist-toolbar">
        <div className="tabs" role="tablist">
          {event.rounds.map((item, i) => (
            <button
              key={item.label + i}
              className="tab"
              type="button"
              role="tab"
              aria-selected={i === roundIndex}
              onClick={() => {
                setRoundIndex(i);
                setExpanded(false);
              }}
            >
              {item.label} <span className="tab__count">{item.songs.length}</span>
            </button>
          ))}
        </div>
        {isFull && (
          <input
            className="setlist-search"
            type="search"
            placeholder="Search this round…"
            aria-label="Search songs in this round"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        )}
      </div>
      <div className="setlist-body">
        {!matches.length ? (
          <p className="setlist-note">No song in this round matches “{query.trim()}”.</p>
        ) : (
          <>
            {query ? (
              <p className="setlist-note">
                {matches.length} of {round.songs.length} songs match.
              </p>
            ) : truncated ? (
              <p className="setlist-note">
                Showing the first {PREVIEW_SONGS} of {round.songs.length} songs.
              </p>
            ) : null}
            <ol className="songs">
              {shown.map((entry) => (
                <li className="song" key={`${entry.n}-${entry.song}`}>
                  <span className="song__n">{padTo(entry.n, width)}</span>
                  <span className="song__title">{entry.song}</span>
                  <span className="song__artist">{entry.artist}</span>
                </li>
              ))}
            </ol>
            {!isFull && (truncated || expanded) && (
              <div className="setlist-actions">
                <button className="setlist-toggle" type="button" onClick={() => setExpanded((value) => !value)}>
                  {truncated ? `Show all ${round.songs.length} songs ↓` : "Show fewer ↑"}
                </button>
                <a className="link-strong" href={eventHref(event)}>
                  Event page →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
