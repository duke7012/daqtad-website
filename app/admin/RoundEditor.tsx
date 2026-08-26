import { useMemo, useState } from "react";
import { Form } from "react-router";
import { Field } from "~/admin/fields";
import type { AdminRound, AdminRoundSong, AdminSong } from "~/types";

export function RoundEditor({
  eventId,
  round,
  roundSongs,
  songs,
}: {
  eventId: string;
  round: AdminRound;
  roundSongs: AdminRoundSong[];
  songs: AdminSong[];
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return songs
      .filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, songs]);

  return (
    <>
      <Form method="post" className="admin-card">
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="id" value={round.id} />
        <div className="admin-head">
          <h2>{round.label}</h2>
          <a className="btn btn--xs btn--ghost" href={`/admin?tab=events&event=${eventId}`}>
            ← Back to event
          </a>
        </div>
        <div className="admin-grid">
          <Field label="Round name" name="label" defaultValue={round.label} />
        </div>
        <div className="admin-actions">
          <button className="btn btn--primary btn--xs" type="submit" name="intent" value="round-rename">
            Rename round
          </button>
          <span className="admin-hint" style={{ margin: 0 }}>
            {roundSongs.length} songs
          </span>
        </div>
      </Form>

      <Form method="post" className="admin-card">
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="round_id" value={round.id} />
        <h2 className="h2">Paste a setlist</h2>
        <p className="admin-hint">
          One song per line, as <code>Title - Artist</code>. Numbering like “12.” is ignored. Songs that are not in the
          library yet are added automatically.
        </p>
        <label className="admin-field">
          <span>Songs</span>
          <textarea name="bulk" placeholder={"Whiplash - aespa\nAPT. - ROSÉ & Bruno Mars\nHow Sweet - NewJeans"} />
        </label>
        <div className="admin-actions">
          <button className="btn btn--primary" type="submit" name="intent" value="bulk-append">
            Add to round
          </button>
          <button
            className="btn btn--xs btn--danger"
            type="submit"
            name="intent"
            value="bulk-replace"
            onClick={(e) => {
              if (!window.confirm("Replace every song in this round with the pasted list?")) e.preventDefault();
            }}
          >
            Replace whole round
          </button>
        </div>
      </Form>

      <div className="admin-card">
        <h2 className="h2">Add one song</h2>
        <div className="song-picker">
          <input
            className="admin-input"
            type="search"
            autoComplete="off"
            placeholder="Search the song library…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {matches.length ? (
            <div className="song-results">
              {matches.map((song) => (
                <Form method="post" key={song.id}>
                  <input type="hidden" name="event_id" value={eventId} />
                  <input type="hidden" name="round_id" value={round.id} />
                  <input type="hidden" name="song_id" value={song.id} />
                  <button type="submit" name="intent" value="pick-song">
                    {song.title} <em>- {song.artist}</em>
                  </button>
                </Form>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-head">
          <h2>Songs in order</h2>
        </div>
        <div className="song-editor">
          {!roundSongs.length ? (
            <div className="admin-empty">This round has no songs yet.</div>
          ) : (
            roundSongs.map((entry, i) => {
              const song = entry.songs || { title: "", artist: "" };
              return (
                <div className="song-line" key={entry.id}>
                  <span className="song-line__n">{i + 1}</span>
                  <span className="song-line__text">
                    {song.title}
                    <br />
                    <span className="song-line__artist">{song.artist}</span>
                  </span>
                  <span className="song-line__actions">
                    <Form method="post">
                      <input type="hidden" name="event_id" value={eventId} />
                      <input type="hidden" name="round_id" value={round.id} />
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="dir" value="-1" />
                      <button type="submit" name="intent" value="rs-move" aria-label="Move up">
                        ↑
                      </button>
                    </Form>
                    <Form method="post">
                      <input type="hidden" name="event_id" value={eventId} />
                      <input type="hidden" name="round_id" value={round.id} />
                      <input type="hidden" name="id" value={entry.id} />
                      <input type="hidden" name="dir" value="1" />
                      <button type="submit" name="intent" value="rs-move" aria-label="Move down">
                        ↓
                      </button>
                    </Form>
                    <Form method="post">
                      <input type="hidden" name="event_id" value={eventId} />
                      <input type="hidden" name="round_id" value={round.id} />
                      <input type="hidden" name="id" value={entry.id} />
                      <button type="submit" name="intent" value="rs-remove" aria-label="Remove">
                        ✕
                      </button>
                    </Form>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
