import { useMemo, useState } from "react";
import { Form, useFetcher } from "react-router";
import type { AdminSong } from "~/types";

function letterOf(value: string) {
  const match = /[a-z0-9]/i.exec(value || "");
  if (!match) return "#";
  return /[0-9]/.test(match[0]) ? "#" : match[0].toUpperCase();
}

export function SongsTab({ songs }: { songs: AdminSong[] }) {
  const [query, setQuery] = useState("");
  const [artist, setArtist] = useState("");
  const [sort, setSort] = useState("title-asc");
  const [letter, setLetter] = useState("");
  const [editId, setEditId] = useState("");
  const editFetcher = useFetcher();

  const sortKey = sort.startsWith("artist") ? "artist" : "title";
  const artists = useMemo(() => {
    const seen: Record<string, boolean> = {};
    const names: string[] = [];
    for (const song of songs) {
      if (!song.artist || seen[song.artist]) continue;
      seen[song.artist] = true;
      names.push(song.artist);
    }
    names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base", numeric: true }));
    return names;
  }, [songs]);

  const passes = (song: AdminSong, ignoreLetter = false) => {
    const q = query.trim().toLowerCase();
    if (q && !`${song.title} ${song.artist}`.toLowerCase().includes(q)) return false;
    if (artist && song.artist !== artist) return false;
    if (!ignoreLetter && letter) {
      const source = sortKey === "artist" ? song.artist : song.title;
      if (letterOf(source) !== letter) return false;
    }
    return true;
  };

  const visible = useMemo(() => {
    const dir = sort.includes("desc") ? -1 : 1;
    return songs.filter((song) => passes(song)).sort((a, b) => {
      const primaryA = sortKey === "artist" ? a.artist : a.title;
      const primaryB = sortKey === "artist" ? b.artist : b.title;
      const secondaryA = sortKey === "artist" ? a.title : a.artist;
      const secondaryB = sortKey === "artist" ? b.title : b.artist;
      const first = String(primaryA || "").localeCompare(String(primaryB || ""), undefined, {
        sensitivity: "base",
        numeric: true,
      });
      if (first) return first * dir;
      return (
        String(secondaryA || "").localeCompare(String(secondaryB || ""), undefined, {
          sensitivity: "base",
          numeric: true,
        }) * dir
      );
    });
  }, [songs, query, artist, sort, letter]);

  const present: Record<string, boolean> = {};
  for (const song of songs) {
    if (!passes(song, true)) continue;
    present[letterOf(sortKey === "artist" ? song.artist : song.title)] = true;
  }

  const titleSort = sort.startsWith("title");
  const artistSort = sort.startsWith("artist");
  const arrow = sort.includes("desc") ? " ↓" : " ↑";
  const filtersOn = !!(query || artist || letter);

  return (
    <>
      <div className="admin-card">
        <div className="admin-head">
          <h2>Song library</h2>
          <span className="admin-hint" style={{ margin: 0 }}>
            {visible.length === songs.length ? `${songs.length} songs` : `Showing ${visible.length} of ${songs.length}`}
          </span>
        </div>
        <p className="admin-hint">
          The pool every setlist draws from. Click a title or artist to edit - it updates everywhere that song appears.
          Deleting one removes it from every setlist.
        </p>
        <div className="song-lib__tools">
          <input
            className="admin-input"
            type="search"
            placeholder="Search title or artist…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search songs"
          />
          <select
            className="admin-input"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            aria-label="Filter by artist"
          >
            <option value="">All artists ({artists.length})</option>
            {artists.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <select className="admin-input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort songs">
            <option value="title-asc">Title A–Z</option>
            <option value="title-desc">Title Z–A</option>
            <option value="artist-asc">Artist A–Z</option>
            <option value="artist-desc">Artist Z–A</option>
          </select>
          {filtersOn ? (
            <button
              className="btn btn--xs btn--ghost"
              type="button"
              onClick={() => {
                setQuery("");
                setArtist("");
                setLetter("");
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="song-lib__letters" role="group" aria-label="Jump to letter">
          <button
            type="button"
            className="song-lib__letter"
            aria-pressed={!letter}
            onClick={() => setLetter("")}
          >
            All
          </button>
          {"ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("").map((item) => (
            <button
              key={item}
              type="button"
              className="song-lib__letter"
              aria-pressed={letter === item}
              disabled={!present[item]}
              onClick={() => setLetter((current) => (current === item ? "" : item))}
            >
              {item}
            </button>
          ))}
        </div>
        <Form method="post" className="song-lib__add">
          <input className="admin-input" type="text" name="new_title" placeholder="Song title" />
          <input className="admin-input" type="text" name="new_artist" placeholder="Artist" />
          <button className="btn btn--primary btn--xs" type="submit" name="intent" value="song-add">
            + Add
          </button>
        </Form>
      </div>

      <details className="admin-card">
        <summary className="song-lib__import">Import many at once</summary>
        <p className="admin-hint">
          One per line, as <code>Title - Artist</code>. Duplicates are skipped.
        </p>
        <Form method="post">
          <label className="admin-field">
            <span>Songs</span>
            <textarea name="bulk_songs" placeholder={"Whiplash - aespa\nMagnetic - ILLIT"} />
          </label>
          <div className="admin-actions">
            <button className="btn btn--primary" type="submit" name="intent" value="songs-import">
              Import
            </button>
          </div>
        </Form>
      </details>

      <div className="admin-card admin-card--table">
        {!visible.length ? (
          <div className="admin-empty">No songs match these filters.</div>
        ) : (
          <table className="song-table">
            <thead>
              <tr>
                <th className="song-table__n">#</th>
                <th>
                  <button type="button" onClick={() => setSort(sort === "title-asc" ? "title-desc" : "title-asc")}>
                    Title{titleSort ? arrow : ""}
                  </button>
                </th>
                <th>
                  <button type="button" onClick={() => setSort(sort === "artist-asc" ? "artist-desc" : "artist-asc")}>
                    Artist{artistSort ? arrow : ""}
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((song, i) => (
                <tr key={song.id} className={editId === song.id ? "is-editing" : undefined}>
                  <td className="song-table__n">{i + 1}</td>
                  {editId === song.id ? (
                    <>
                      <td>
                        <editFetcher.Form method="post">
                          <input type="hidden" name="intent" value="song-edit" />
                          <input type="hidden" name="id" value={song.id} />
                          <input type="hidden" name="part" value="title" />
                          <input
                            className="song-table__input"
                            type="text"
                            name="value"
                            defaultValue={song.title}
                            aria-label="Title"
                            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                          />
                        </editFetcher.Form>
                      </td>
                      <td>
                        <editFetcher.Form method="post">
                          <input type="hidden" name="intent" value="song-edit" />
                          <input type="hidden" name="id" value={song.id} />
                          <input type="hidden" name="part" value="artist" />
                          <input
                            className="song-table__input"
                            type="text"
                            name="value"
                            defaultValue={song.artist}
                            aria-label="Artist"
                            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                          />
                        </editFetcher.Form>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <button className="song-table__text" type="button" onClick={() => setEditId(song.id)}>
                          {song.title}
                        </button>
                      </td>
                      <td>
                        <button
                          className="song-table__text song-table__text--muted"
                          type="button"
                          onClick={() => setEditId(song.id)}
                        >
                          {song.artist}
                        </button>
                      </td>
                    </>
                  )}
                  <td className="song-table__actions">
                    {editId === song.id ? (
                      <button className="btn btn--xs btn--ghost" type="button" onClick={() => setEditId("")}>
                        Done
                      </button>
                    ) : null}
                    <Form method="post">
                      <input type="hidden" name="id" value={song.id} />
                      <button
                        className="btn btn--xs btn--danger"
                        type="submit"
                        name="intent"
                        value="song-delete"
                        onClick={(e) => {
                          if (!window.confirm("Delete this song? It will be removed from every setlist.")) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
