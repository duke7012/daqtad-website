/* ==========================================================================
   DA'QTAD — admin
   --------------------------------------------------------------------------
   Everything the site shows can be edited here: events, rounds, the song
   library, photos, the FAQ and the social links. Nothing on this page works
   without logging in, and the database itself rejects writes from anyone who
   is not listed in the `admins` table.
   ========================================================================== */

(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var app = document.querySelector('[data-render="app"]');
  var sessionBar = document.querySelector('[data-render="session"]');

  var sb = null;
  var user = null;
  var statusNode = null;
  var statusTimer = null;

  var TIMEZONES = [
    'America/Denver', 'America/Los_Angeles', 'America/Chicago',
    'America/New_York', 'Asia/Ho_Chi_Minh', 'UTC'
  ];

  var state = {
    tab: 'events',
    events: [],
    songs: [],
    faqs: [],
    settings: null,
    event: null,        // event currently open in the editor
    rounds: [],
    photos: [],
    round: null,        // round currently open in the song editor
    roundSongs: [],
    songQuery: '',
    requests: [],
    requestsFor: ''
  };

  /* --------------------------------------------------------- utilities -- */

  var ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ENTITIES[c];
    });
  }

  // Relative links are left alone, but anything carrying a scheme has to be
  // http(s), so a "javascript:" address submitted with a request can never
  // reach an href.
  function safeHref(url) {
    var clean = String(url == null ? '' : url).replace(/[\u0000-\u001F\u007F]/g, '').trim();
    if (/^[a-z][a-z0-9+.-]*:/i.test(clean) && !/^https?:/i.test(clean)) return '';
    return clean;
  }

  // Paths stored in the database are written relative to the site root.
  function rooted(url) {
    var clean = safeHref(url);
    if (!clean || /^https?:\/\//i.test(clean) || clean.charAt(0) === '/') return clean;
    return '/' + clean;
  }

  function $(selector, root) { return (root || app).querySelector(selector); }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || app).querySelectorAll(selector));
  }

  function value(name) {
    var node = $('[name="' + name + '"]');
    if (!node) return '';
    return node.type === 'checkbox' ? node.checked : node.value.trim();
  }

  function say(message, failed) {
    if (!statusNode) return;
    statusNode.textContent = message || '';
    if (failed) statusNode.setAttribute('data-error', '');
    else statusNode.removeAttribute('data-error');
    clearTimeout(statusTimer);
    if (message && !failed) {
      statusTimer = setTimeout(function () { statusNode.textContent = ''; }, 4000);
    }
  }

  // Unwraps the { data, error } shape supabase-js returns.
  function q(builder) {
    return Promise.resolve(builder).then(function (result) {
      if (result.error) throw result.error;
      return result.data;
    });
  }

  function fail(error) {
    say(error && error.message ? error.message : 'Something went wrong', true);
    if (window.console) console.error('[admin]', error);
  }

  function confirmed(message) { return window.confirm(message); }

  /* ------------------------------------------------------------- dates -- */

  // "GMT-06:00" -> "-06:00" for the given zone at the given instant.
  function offsetFor(timeZone, date) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone, timeZoneName: 'longOffset'
      }).formatToParts(date);
      var name = parts.filter(function (p) { return p.type === 'timeZoneName'; })[0];
      var match = /GMT([+-]\d{2}:\d{2})/.exec(name ? name.value : '');
      return match ? match[1] : '+00:00';
    } catch (err) {
      return '+00:00';
    }
  }

  // Wall-clock date + time in a zone -> UTC timestamp for the database.
  function toIso(dateStr, timeStr, timeZone) {
    if (!dateStr) return null;
    var local = dateStr + 'T' + (timeStr || '00:00') + ':00';
    // Two passes so the offset is right on either side of a DST change.
    var guess = offsetFor(timeZone, new Date(local + 'Z'));
    var refined = offsetFor(timeZone, new Date(local + guess));
    return new Date(local + refined).toISOString();
  }

  // UTC timestamp -> the date and time fields as seen in the event's zone.
  function fromIso(iso, timeZone) {
    if (!iso) return { date: '', time: '' };
    try {
      var parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(new Date(iso));
      var get = function (type) {
        var part = parts.filter(function (p) { return p.type === type; })[0];
        return part ? part.value : '';
      };
      var hour = get('hour') === '24' ? '00' : get('hour');
      return {
        date: get('year') + '-' + get('month') + '-' + get('day'),
        time: hour + ':' + get('minute')
      };
    } catch (err) {
      return { date: '', time: '' };
    }
  }

  /* ------------------------------------------------------------ markup -- */

  function field(label, name, val, options) {
    var opt = options || {};
    var type = opt.type || 'text';
    var hint = opt.hint ? '<small>' + esc(opt.hint) + '</small>' : '';

    var input;
    if (type === 'textarea') {
      input = '<textarea name="' + name + '">' + esc(val) + '</textarea>';
    } else if (type === 'select') {
      input = '<select name="' + name + '">' + opt.choices.map(function (choice) {
        var v = choice.value === undefined ? choice : choice.value;
        var text = choice.label === undefined ? choice : choice.label;
        return '<option value="' + esc(v) + '"' + (String(val) === String(v) ? ' selected' : '') +
          '>' + esc(text) + '</option>';
      }).join('') + '</select>';
    } else {
      input = '<input type="' + type + '" name="' + name + '" value="' + esc(val) + '"' +
        (opt.placeholder ? ' placeholder="' + esc(opt.placeholder) + '"' : '') + '>';
    }

    return '<label class="admin-field"><span>' + esc(label) + hint + '</span>' + input + '</label>';
  }

  function checkbox(label, name, checked) {
    return '<label class="admin-check"><input type="checkbox" name="' + name + '"' +
      (checked ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }

  function button(label, action, extra) {
    var attrs = extra || {};
    var out = '<button class="btn btn--xs ' + (attrs.style || 'btn--ghost') +
      '" type="button" data-action="' + action + '"';
    for (var key in attrs.data || {}) out += ' data-' + key + '="' + esc(attrs.data[key]) + '"';
    return out + '>' + esc(label) + '</button>';
  }

  /* -------------------------------------------------------------- data -- */

  function loadEvents() {
    return q(sb.from('events').select('*').order('position', { ascending: false }))
      .then(function (rows) { state.events = rows || []; });
  }

  // PostgREST caps how many rows one request returns, so the library is read a
  // page at a time until a page comes back empty. ensureSongs depends on this
  // copy being complete. Titles repeat across artists, so id breaks the tie and
  // keeps the paging order stable.
  var SONG_PAGE = 1000;

  function fetchSongPage(from, collected) {
    return q(sb.from('songs').select('*')
      .order('title', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + SONG_PAGE - 1))
      .then(function (rows) {
        var page = rows || [];
        var all = collected.concat(page);
        if (!page.length) return all;
        return fetchSongPage(from + page.length, all);
      });
  }

  function loadSongs() {
    return fetchSongPage(0, []).then(function (rows) { state.songs = rows; });
  }

  function loadFaqs() {
    return q(sb.from('faqs').select('*').order('position', { ascending: true }))
      .then(function (rows) { state.faqs = rows || []; });
  }

  function loadSettings() {
    return q(sb.from('site_settings').select('*').limit(1))
      .then(function (rows) { state.settings = (rows && rows[0]) || {}; });
  }

  function loadEventDetail(eventId) {
    return Promise.all([
      q(sb.from('rounds').select('*').eq('event_id', eventId).order('position')),
      q(sb.from('photos').select('*').eq('event_id', eventId).order('position'))
    ]).then(function (results) {
      state.rounds = results[0] || [];
      state.photos = results[1] || [];
      return countRoundSongs();
    });
  }

  // One query for the counts shown next to each round.
  function countRoundSongs() {
    if (!state.rounds.length) return Promise.resolve();
    var ids = state.rounds.map(function (r) { return r.id; });
    return q(sb.from('round_songs').select('round_id').in('round_id', ids))
      .then(function (rows) {
        var counts = {};
        (rows || []).forEach(function (row) {
          counts[row.round_id] = (counts[row.round_id] || 0) + 1;
        });
        state.rounds.forEach(function (round) { round.count = counts[round.id] || 0; });
      });
  }

  function loadRoundSongs(roundId) {
    return q(sb.from('round_songs')
      .select('id,position,song_id,songs(id,title,artist)')
      .eq('round_id', roundId)
      .order('position'))
      .then(function (rows) { state.roundSongs = rows || []; });
  }

  /* -------------------------------------------------------- song input -- */

  // Accepts "Title — Artist", "Title - Artist", "Title | Artist" and tolerates
  // leading numbering such as "12." or "12)".
  function parseSongLines(text) {
    return String(text || '').split('\n').map(function (line) {
      return line.trim();
    }).filter(Boolean).map(function (line) {
      line = line.replace(/^\d+\s*[.)\]:-]\s*/, '');
      var parts = line.split(/\s+[—–|]\s+|\s+-\s+|\t+/);
      if (parts.length >= 2) {
        return {
          title: parts[0].trim(),
          artist: parts.slice(1).join(' - ').trim()
        };
      }
      return { title: line, artist: '' };
    }).filter(function (song) { return song.title; });
  }

  function songKey(title, artist) {
    return (title + '|' + artist).toLowerCase();
  }

  function songLibrary() {
    var known = {};
    state.songs.forEach(function (song) {
      known[songKey(song.title, song.artist)] = song;
    });
    return known;
  }

  function isDuplicate(error) {
    return !!error && (error.code === '23505' ||
      /duplicate key|already exists/i.test(error.message || ''));
  }

  // Inserts the wanted songs the library does not have yet. A song that exists
  // in the database but is missing from `state.songs` would trip the unique
  // index, so one such failure is retried against a freshly read library.
  function insertMissing(wanted, retry) {
    var known = songLibrary();
    var missing = wanted.filter(function (song) {
      return !known[songKey(song.title, song.artist)];
    });
    if (!missing.length) return Promise.resolve(0);

    return q(sb.from('songs').insert(missing).select())
      .then(function (rows) {
        (rows || []).forEach(function (row) { state.songs.push(row); });
        return (rows || []).length;
      })
      .catch(function (error) {
        if (!retry || !isDuplicate(error)) throw error;
        return loadSongs().then(function () { return insertMissing(wanted, false); });
      });
  }

  // Adds any songs that are not in the library yet, then returns every parsed
  // line paired with its library row, in the original order.
  function ensureSongs(parsed) {
    var wanted = [];
    var seen = {};
    parsed.forEach(function (song) {
      var key = songKey(song.title, song.artist);
      if (seen[key]) return;
      seen[key] = true;
      wanted.push({ title: song.title, artist: song.artist });
    });

    // Re-read the library first: deciding from a stale copy would re-insert
    // songs that already exist.
    return loadSongs().then(function () {
      return insertMissing(wanted, true);
    }).then(function (added) {
      var known = songLibrary();
      return {
        added: added,
        songs: parsed.map(function (song) {
          return known[songKey(song.title, song.artist)];
        }).filter(Boolean)
      };
    });
  }

  /* ------------------------------------------------------------ upload -- */

  function uploadFile(file, folder) {
    var clean = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    var path = folder + '/' + Date.now() + '-' + clean;
    return q(sb.storage.from('media').upload(path, file, { cacheControl: '3600' }))
      .then(function () {
        return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
      });
  }

  /* ------------------------------------------------------------- views -- */

  function renderUnconfigured() {
    app.innerHTML =
      '<div class="admin-banner admin-banner--warn">' +
        '<strong>The database is not connected yet.</strong><br>' +
        'Open <code>assets/js/supabase-config.js</code> and paste your Supabase ' +
        'project URL and publishable key, then reload this page. ' +
        'The full walkthrough is in <code>README.md</code>.' +
      '</div>' +
      '<div class="admin-card"><h2>Setup, in short</h2>' +
      '<ol class="admin-hint">' +
        '<li>Create a free project at supabase.com.</li>' +
        '<li>SQL Editor → run <code>supabase/schema.sql</code>, then <code>supabase/seed.sql</code>.</li>' +
        '<li>Authentication → Users → add yourself, then run the last query in schema.sql.</li>' +
        '<li>Project Settings → API keys → copy the URL and publishable key into ' +
          '<code>assets/js/supabase-config.js</code>.</li>' +
      '</ol></div>';
  }

  function renderLogin(message) {
    sessionBar.innerHTML = '';
    app.innerHTML =
      '<div class="admin-login"><div class="admin-card">' +
        '<h2 class="h2">Sign in</h2>' +
        '<p class="admin-hint">Use the email and password you created in ' +
          'Supabase → Authentication → Users.</p>' +
        (message ? '<p class="admin-status" data-error>' + esc(message) + '</p>' : '') +
        '<div class="admin-grid">' +
          field('Email', 'email', '', { type: 'email' }) +
          field('Password', 'password', '', { type: 'password' }) +
        '</div>' +
        '<div class="admin-actions">' +
          '<button class="btn btn--primary" type="button" data-action="login">Sign in →</button>' +
        '</div>' +
      '</div></div>';
  }

  function renderSession() {
    sessionBar.innerHTML = user
      ? '<span>' + esc(user.email) + '</span>' +
        '<a class="btn btn--xs btn--ghost" href="/">View site ↗</a>' +
        button('Sign out', 'logout')
      : '';
  }

  function renderShell(body) {
    var tabs = [
      ['events', 'Events'],
      ['songs', 'Song library'],
      ['faqs', 'FAQ'],
      ['requests', 'Requests'],
      ['settings', 'Settings']
    ].map(function (tab) {
      return '<button class="admin-tab" type="button" data-action="tab" data-tab="' + tab[0] +
        '" aria-selected="' + (state.tab === tab[0]) + '">' + tab[1] + '</button>';
    }).join('');

    app.innerHTML = '<div class="admin-tabs">' + tabs + '</div>' + body;
  }

  /* ------------------------------------------------------ view: events -- */

  function eventsView() {
    var rows = state.events.length ? state.events.map(function (ev) {
      var when = ev.starts_at
        ? new Date(ev.starts_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', timeZone: ev.timezone || 'UTC'
          })
        : 'no date';
      var page = safeHref(ev.page) || '/events/' + encodeURIComponent(ev.slug);

      return '<div class="admin-row">' +
        '<div class="admin-row__main">' +
          '<div class="admin-row__title">' + esc(ev.name) +
            (ev.subtitle ? ' — ' + esc(ev.subtitle) : '') + '</div>' +
          '<div class="admin-row__meta">' + esc(ev.status) + ' · ' + esc(when) +
            ' · /' + esc(ev.slug) + '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          '<a class="btn btn--xs btn--ghost" href="' + esc(page) + '" target="_blank" rel="noopener">Open ↗</a>' +
          button('Edit', 'event-open', { style: 'btn--primary', data: { id: ev.id } }) +
          button('Delete', 'event-delete', { style: 'btn--danger', data: { id: ev.id } }) +
        '</div>' +
      '</div>';
    }).join('') : '<div class="admin-empty">No events yet. Add your first one.</div>';

    return '<div class="admin-card">' +
      '<div class="admin-head"><h2>Events</h2>' +
        button('+ New event', 'event-new', { style: 'btn--primary' }) +
      '</div>' + rows + '</div>';
  }

  function eventEditorView() {
    var ev = state.event;
    var zone = ev.timezone || 'America/Denver';
    var start = fromIso(ev.starts_at, zone);
    var end = fromIso(ev.ends_at, zone);

    var rounds = state.rounds.length ? state.rounds.map(function (round, i) {
      return '<div class="admin-row">' +
        '<div class="admin-row__main">' +
          '<div class="admin-row__title">' + esc(round.label) + '</div>' +
          '<div class="admin-row__meta">' + (round.count || 0) + ' songs</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          button('Edit songs', 'round-open', { style: 'btn--primary', data: { id: round.id } }) +
          button('↑', 'round-move', { data: { id: round.id, dir: '-1' } }) +
          button('↓', 'round-move', { data: { id: round.id, dir: '1' } }) +
          button('Delete', 'round-delete', { style: 'btn--danger', data: { id: round.id } }) +
        '</div>' +
      '</div>';
    }).join('') : '<div class="admin-empty">No rounds yet.</div>';

    var photos = state.photos.length ? '<div class="admin-thumbs">' +
      state.photos.map(function (photo, i) {
        return '<div class="admin-thumb">' +
          '<img src="' + esc(rooted(photo.url)) + '" alt="">' +
          '<div class="admin-thumb__body">' +
            '<input type="text" value="' + esc(photo.alt) + '" placeholder="Describe the photo"' +
              ' data-change="photo-alt" data-id="' + esc(photo.id) + '">' +
            '<div class="admin-thumb__row">' +
              button('↑', 'photo-move', { data: { id: photo.id, dir: '-1' } }) +
              button('↓', 'photo-move', { data: { id: photo.id, dir: '1' } }) +
              button('Delete', 'photo-delete', { style: 'btn--danger', data: { id: photo.id } }) +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>'
      : '<div class="admin-empty">No photos yet.</div>';

    return '<div class="admin-card">' +
      '<div class="admin-head">' +
        '<h2>' + (ev.id ? esc(ev.name || 'Edit event') : 'New event') + '</h2>' +
        button('← Back to events', 'events-back') +
      '</div>' +

      '<div class="admin-grid">' +
        field('Name', 'name', ev.name || '', { placeholder: '#RDD9' }) +
        field('Subtitle', 'subtitle', ev.subtitle || '', { placeholder: 'Bopsim Korean Festival' }) +
        field('URL slug', 'slug', ev.slug || '', {
          hint: ' — lowercase, no spaces', placeholder: 'rdd-9'
        }) +
        field('Status', 'status', ev.status || 'upcoming', {
          type: 'select', choices: ['upcoming', 'past']
        }) +
        field('Date', 'date', start.date, { type: 'date' }) +
        field('Start time', 'start_time', start.time, { type: 'time' }) +
        field('End time', 'end_time', end.time, { type: 'time' }) +
        field('Timezone', 'timezone', zone, { type: 'select', choices: TIMEZONES }) +
        field('Venue', 'venue', ev.venue || '', { placeholder: 'Liberty Park, Salt Lake City, UT' }) +
        field('Venue (short)', 'venue_short', ev.venue_short || '', { placeholder: 'Liberty Park, SLC' }) +
        field('Badge', 'badge', ev.badge || '', {
          hint: ' — pill on the events page', placeholder: 'Upcoming · requests open'
        }) +
        field('Link text', 'cta', ev.cta || '', { placeholder: 'Photos · video · setlist →' }) +
        field('Stats line', 'stats', ev.stats || '', { placeholder: '~60 dancers · 3 hours' }) +
        field('Recap video', 'video', ev.video || '', {
          hint: ' — YouTube link', placeholder: 'https://youtu.be/…'
        }) +
        field('Sort order', 'position', ev.position || 0, {
          type: 'number', hint: ' — higher shows first'
        }) +
        field('Custom page', 'page', ev.page || '', {
          hint: ' — leave blank to use /events/' + (ev.slug || 'the-slug'),
          placeholder: '/events/popup'
        }) +
      '</div>' +

      '<div class="admin-actions">' + checkbox('Song requests are open', 'requests_open', ev.requests_open) + '</div>' +

      '<div class="admin-actions">' +
        '<button class="btn btn--primary" type="button" data-action="event-save">Save event</button>' +
        button('Cancel', 'events-back') +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<h2 class="h2">Poster and cover</h2>' +
      '<p class="admin-hint">Upload an image or paste a link. The poster is the tall ' +
        'image on the events page; the cover is the wide one on the home page.</p>' +
      '<div class="admin-grid">' +
        field('Poster URL', 'poster_url', ev.poster_url || '') +
        field('Cover URL', 'cover_url', ev.cover_url || '') +
      '</div>' +
      '<div class="admin-grid" style="margin-top:12px">' +
        '<label class="admin-field"><span>Upload poster</span>' +
          '<input type="file" accept="image/*" data-change="upload-image" data-target="poster_url"></label>' +
        '<label class="admin-field"><span>Upload cover</span>' +
          '<input type="file" accept="image/*" data-change="upload-image" data-target="cover_url"></label>' +
      '</div>' +
      '<p class="admin-hint">Uploading fills the box above — then press <strong>Save event</strong>.</p>' +
    '</div>' +

    (ev.id
      ? '<div class="admin-card">' +
          '<div class="admin-head"><h2>Rounds</h2></div>' +
          '<p class="admin-hint">Each round is one setlist. Open a round to paste ' +
            'or pick its songs.</p>' +
          rounds +
          '<div class="admin-actions">' +
            '<input class="admin-input" type="text" name="round_label" placeholder="Round 1 · 6:00 PM" style="max-width:280px">' +
            '<button class="btn btn--primary btn--xs" type="button" data-action="round-add">+ Add round</button>' +
          '</div>' +
        '</div>' +

        '<div class="admin-card">' +
          '<div class="admin-head"><h2>Photos</h2></div>' +
          '<p class="admin-hint">These show on the gallery page and on this event\'s page.</p>' +
          photos +
          '<div class="admin-actions">' +
            '<label class="admin-field"><span>Upload photos</span>' +
              '<input type="file" accept="image/*" multiple data-change="upload-photos"></label>' +
          '</div>' +
        '</div>'
      : '<div class="admin-card"><p class="admin-hint">Save the event first, then ' +
        'rounds and photos can be added.</p></div>');
  }

  function roundEditorView() {
    var lines = state.roundSongs.length ? state.roundSongs.map(function (entry, i) {
      var song = entry.songs || {};
      return '<div class="song-line">' +
        '<span class="song-line__n">' + (i + 1) + '</span>' +
        '<span class="song-line__text">' + esc(song.title) +
          '<br><span class="song-line__artist">' + esc(song.artist) + '</span></span>' +
        '<span class="song-line__actions">' +
          '<button type="button" data-action="rs-move" data-id="' + esc(entry.id) +
            '" data-dir="-1" aria-label="Move up">↑</button>' +
          '<button type="button" data-action="rs-move" data-id="' + esc(entry.id) +
            '" data-dir="1" aria-label="Move down">↓</button>' +
          '<button type="button" data-action="rs-remove" data-id="' + esc(entry.id) +
            '" aria-label="Remove">✕</button>' +
        '</span>' +
      '</div>';
    }).join('') : '<div class="admin-empty">This round has no songs yet.</div>';

    return '<div class="admin-card">' +
      '<div class="admin-head">' +
        '<h2>' + esc(state.round.label) + '</h2>' +
        button('← Back to event', 'round-back') +
      '</div>' +
      '<div class="admin-grid">' +
        field('Round name', 'label', state.round.label) +
      '</div>' +
      '<div class="admin-actions">' +
        '<button class="btn btn--primary btn--xs" type="button" data-action="round-rename">Rename round</button>' +
        '<span class="admin-hint" style="margin:0">' + state.roundSongs.length + ' songs</span>' +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<h2 class="h2">Paste a setlist</h2>' +
      '<p class="admin-hint">One song per line, as <code>Title — Artist</code>. ' +
        'Numbering like “12.” is ignored. Songs that are not in the library yet ' +
        'are added automatically.</p>' +
      '<label class="admin-field"><span>Songs</span>' +
        '<textarea name="bulk" placeholder="Whiplash — aespa&#10;APT. — ROSÉ &amp; Bruno Mars&#10;How Sweet — NewJeans"></textarea></label>' +
      '<div class="admin-actions">' +
        '<button class="btn btn--primary" type="button" data-action="bulk-append">Add to round</button>' +
        button('Replace whole round', 'bulk-replace', { style: 'btn--danger' }) +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<h2 class="h2">Add one song</h2>' +
      '<div class="song-picker">' +
        '<input class="admin-input" type="search" name="pick" autocomplete="off"' +
          ' placeholder="Search the song library…" data-input="pick">' +
        '<div class="song-results" hidden></div>' +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<div class="admin-head"><h2>Songs in order</h2></div>' +
      '<div class="song-editor">' + lines + '</div>' +
    '</div>';
  }

  /* ------------------------------------------------------- view: songs -- */

  function songsView() {
    var query = state.songQuery.toLowerCase();
    var matches = !query ? state.songs : state.songs.filter(function (song) {
      return (song.title + ' ' + song.artist).toLowerCase().indexOf(query) !== -1;
    });

    var capped = matches.slice(0, 200);
    var rows = capped.map(function (song) {
      return '<div class="admin-row">' +
        '<div class="admin-row__main" style="display:flex;gap:8px;flex-wrap:wrap;flex:1">' +
          '<input class="admin-input" style="max-width:280px" type="text" value="' + esc(song.title) +
            '" data-change="song-edit" data-id="' + esc(song.id) + '" data-part="title">' +
          '<input class="admin-input" style="max-width:220px" type="text" value="' + esc(song.artist) +
            '" data-change="song-edit" data-id="' + esc(song.id) + '" data-part="artist">' +
        '</div>' +
        '<div class="admin-row__actions">' +
          button('Delete', 'song-delete', { style: 'btn--danger', data: { id: song.id } }) +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="admin-card">' +
      '<div class="admin-head"><h2>Song library</h2>' +
        '<span class="admin-hint" style="margin:0">' + state.songs.length + ' songs</span>' +
      '</div>' +
      '<p class="admin-hint">The pool every setlist draws from. Editing a song here ' +
        'updates it everywhere it appears. Deleting one removes it from every setlist.</p>' +
      '<input class="admin-input" type="search" placeholder="Search songs…" ' +
        'value="' + esc(state.songQuery) + '" data-input="song-search">' +
      '<div class="admin-actions">' +
        '<input class="admin-input" style="max-width:260px" type="text" name="new_title" placeholder="Song title">' +
        '<input class="admin-input" style="max-width:220px" type="text" name="new_artist" placeholder="Artist">' +
        '<button class="btn btn--primary btn--xs" type="button" data-action="song-add">+ Add song</button>' +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      '<h2 class="h2">Import many at once</h2>' +
      '<p class="admin-hint">One per line, as <code>Title — Artist</code>. Duplicates are skipped.</p>' +
      '<label class="admin-field"><span>Songs</span>' +
        '<textarea name="bulk_songs" placeholder="Whiplash — aespa&#10;Magnetic — ILLIT"></textarea></label>' +
      '<div class="admin-actions">' +
        '<button class="btn btn--primary" type="button" data-action="songs-import">Import</button>' +
      '</div>' +
    '</div>' +

    '<div class="admin-card">' +
      (matches.length > capped.length
        ? '<p class="admin-hint">Showing the first 200 of ' + matches.length +
          ' matches — search to narrow it down.</p>'
        : '') +
      (rows || '<div class="admin-empty">No songs match.</div>') +
    '</div>';
  }

  /* -------------------------------------------------------- view: FAQ -- */

  function faqsView() {
    var rows = state.faqs.length ? state.faqs.map(function (faq) {
      return '<div class="admin-card admin-card--tight">' +
        '<div class="admin-grid">' +
          '<label class="admin-field"><span>Question</span>' +
            '<input type="text" value="' + esc(faq.question) + '" data-change="faq-edit"' +
            ' data-id="' + esc(faq.id) + '" data-part="question"></label>' +
        '</div>' +
        '<label class="admin-field" style="margin-top:12px"><span>Answer</span>' +
          '<textarea data-change="faq-edit" data-id="' + esc(faq.id) + '" data-part="answer">' +
          esc(faq.answer) + '</textarea></label>' +
        '<div class="admin-actions">' +
          button('↑', 'faq-move', { data: { id: faq.id, dir: '-1' } }) +
          button('↓', 'faq-move', { data: { id: faq.id, dir: '1' } }) +
          button('Delete', 'faq-delete', { style: 'btn--danger', data: { id: faq.id } }) +
        '</div>' +
      '</div>';
    }).join('') : '<div class="admin-empty">No questions yet.</div>';

    return '<div class="admin-card">' +
      '<div class="admin-head"><h2>FAQ</h2>' +
        button('+ Add question', 'faq-add', { style: 'btn--primary' }) +
      '</div>' +
      '<p class="admin-hint">Shown on the About page. Changes save as you type.</p>' +
    '</div>' + rows;
  }

  /* --------------------------------------------------- view: requests -- */

  function requestsView() {
    var options = state.events.map(function (ev) {
      return '<option value="' + esc(ev.id) + '"' +
        (state.requestsFor === ev.id ? ' selected' : '') + '>' + esc(ev.name) + '</option>';
    }).join('');

    var rows = state.requests.length ? state.requests.map(function (req) {
      // Visitors type these, so only an absolute http(s) address is turned into
      // a link; anything else is shown as plain text.
      var href = safeHref(req.link);
      var link = /^https?:\/\//i.test(href)
        ? ' · <a href="' + esc(href) + '" target="_blank" rel="noopener">link ↗</a>'
        : (req.link ? ' · ' + esc(req.link) : '');

      return '<div class="admin-row">' +
        '<div class="admin-row__main">' +
          '<div class="admin-row__title">' + esc(req.song) +
            (req.artist ? ' <span class="admin-row__meta" style="display:inline">— ' +
              esc(req.artist) + '</span>' : '') + '</div>' +
          '<div class="admin-row__meta">' +
            (req.part ? esc(req.part) : 'any part') + link +
          '</div>' +
        '</div>' +
        '<div class="admin-row__actions">' +
          button('Delete', 'request-delete', { style: 'btn--danger', data: { id: req.id } }) +
        '</div>' +
      '</div>';
    }).join('') : '<div class="admin-empty">No requests for this event yet.</div>';

    return '<div class="admin-card">' +
      '<div class="admin-head"><h2>Song requests</h2>' +
        '<span class="admin-hint" style="margin:0">' + state.requests.length + ' total</span>' +
      '</div>' +
      '<label class="admin-field" style="max-width:320px"><span>Event</span>' +
        '<select data-change="requests-event">' + options + '</select></label>' +
      '<div style="margin-top:16px">' + rows + '</div>' +
    '</div>';
  }

  /* --------------------------------------------------- view: settings -- */

  function settingsView() {
    var s = state.settings || {};
    return '<div class="admin-card">' +
      '<div class="admin-head"><h2>Settings</h2></div>' +
      '<p class="admin-hint">These links appear in the footer and on the About page.</p>' +
      '<div class="admin-grid">' +
        field('Instagram', 'instagram', s.instagram || '', { type: 'url' }) +
        field('Facebook', 'facebook', s.facebook || '', { type: 'url' }) +
        field('Google Drive', 'drive', s.drive || '', { type: 'url' }) +
      '</div>' +
      '<div class="admin-actions">' +
        '<button class="btn btn--primary" type="button" data-action="settings-save">Save</button>' +
      '</div>' +
    '</div>';
  }

  /* -------------------------------------------------------------- draw -- */

  function draw() {
    if (state.round) return renderShell(roundEditorView());
    if (state.event) return renderShell(eventEditorView());

    if (state.tab === 'events') return renderShell(eventsView());
    if (state.tab === 'songs') return renderShell(songsView());
    if (state.tab === 'faqs') return renderShell(faqsView());
    if (state.tab === 'requests') return renderShell(requestsView());
    if (state.tab === 'settings') return renderShell(settingsView());
  }

  /* ----------------------------------------------------------- actions -- */

  function eventFromForm() {
    var zone = value('timezone') || 'America/Denver';
    var date = value('date');
    return {
      slug: value('slug'),
      name: value('name'),
      subtitle: value('subtitle'),
      status: value('status'),
      timezone: zone,
      starts_at: toIso(date, value('start_time'), zone),
      ends_at: value('end_time') ? toIso(date, value('end_time'), zone) : null,
      venue: value('venue'),
      venue_short: value('venue_short'),
      badge: value('badge'),
      cta: value('cta'),
      stats: value('stats'),
      video: value('video'),
      poster_url: value('poster_url'),
      cover_url: value('cover_url'),
      page: value('page'),
      position: Number(value('position')) || 0,
      requests_open: value('requests_open')
    };
  }

  function nextPosition(list) {
    return list.reduce(function (max, row) {
      return Math.max(max, row.position || 0);
    }, -1) + 1;
  }

  function swapPositions(table, list, id, direction) {
    var index = -1;
    list.forEach(function (row, i) { if (row.id === id) index = i; });
    var other = index + direction;
    if (index < 0 || other < 0 || other >= list.length) return Promise.resolve();

    var a = list[index];
    var b = list[other];
    // Positions can be equal or duplicated in old data, so renumber by index.
    return Promise.all([
      q(sb.from(table).update({ position: other }).eq('id', a.id)),
      q(sb.from(table).update({ position: index }).eq('id', b.id))
    ]);
  }

  var actions = {
    login: function () {
      var email = value('email');
      var password = value('password');
      say('Signing in…');
      sb.auth.signInWithPassword({ email: email, password: password })
        .then(function (result) {
          if (result.error) return renderLogin(result.error.message);
          user = result.data.user;
          say('');
          start();
        })
        .catch(function (error) {
          renderLogin((error && error.message) || 'Could not sign in — try again.');
        });
    },

    logout: function () {
      sb.auth.signOut().then(function () {
        user = null;
        renderLogin();
      }).catch(function () {
        user = null;
        renderLogin('Signed out on this device, but the server could not be reached.');
      });
    },

    tab: function (node) {
      state.tab = node.getAttribute('data-tab');
      state.event = null;
      state.round = null;

      if (state.tab === 'requests') {
        state.requestsFor = state.requestsFor || (state.events[0] && state.events[0].id) || '';
        return refreshRequests();
      }
      draw();
    },

    /* -------------------------------------------------------- events -- */

    'event-new': function () {
      state.event = { status: 'upcoming', timezone: 'America/Denver', position: 0 };
      state.rounds = [];
      state.photos = [];
      draw();
    },

    'event-open': function (node) {
      var id = node.getAttribute('data-id');
      var found = state.events.filter(function (ev) { return ev.id === id; })[0];
      if (!found) return;
      state.event = found;
      say('Loading…');
      loadEventDetail(id).then(function () {
        say('');
        draw();
      }).catch(fail);
    },

    'events-back': function () {
      state.event = null;
      state.round = null;
      draw();
    },

    'event-save': function () {
      var payload = eventFromForm();
      if (!payload.name || !payload.slug) {
        return say('A name and a URL slug are required.', true);
      }

      var isNew = !state.event.id;
      var request = isNew
        ? q(sb.from('events').insert(payload).select().single())
        : q(sb.from('events').update(payload).eq('id', state.event.id).select().single());

      say('Saving…');
      request.then(function (row) {
        state.event = row;
        return loadEvents().then(function () { return loadEventDetail(row.id); });
      }).then(function () {
        say('Saved ✓');
        draw();
      }).catch(fail);
    },

    'event-delete': function (node) {
      var id = node.getAttribute('data-id');
      var found = state.events.filter(function (ev) { return ev.id === id; })[0];
      if (!confirmed('Delete "' + (found ? found.name : 'this event') +
        '" with all its rounds and photos? This cannot be undone.')) return;

      q(sb.from('events').delete().eq('id', id))
        .then(loadEvents)
        .then(function () { say('Deleted'); draw(); })
        .catch(fail);
    },

    /* -------------------------------------------------------- rounds -- */

    'round-add': function () {
      var label = value('round_label') || 'Round ' + (state.rounds.length + 1);
      q(sb.from('rounds').insert({
        event_id: state.event.id,
        label: label,
        position: nextPosition(state.rounds)
      }))
        .then(function () { return loadEventDetail(state.event.id); })
        .then(function () { say('Round added'); draw(); })
        .catch(fail);
    },

    'round-open': function (node) {
      var id = node.getAttribute('data-id');
      var found = state.rounds.filter(function (r) { return r.id === id; })[0];
      if (!found) return;
      state.round = found;
      say('Loading songs…');
      loadRoundSongs(id).then(function () { say(''); draw(); }).catch(fail);
    },

    'round-back': function () {
      state.round = null;
      loadEventDetail(state.event.id).then(draw).catch(fail);
    },

    'round-rename': function () {
      var label = value('label');
      if (!label) return say('Give the round a name.', true);
      q(sb.from('rounds').update({ label: label }).eq('id', state.round.id))
        .then(function () {
          state.round.label = label;
          say('Renamed ✓');
          draw();
        })
        .catch(fail);
    },

    'round-move': function (node) {
      swapPositions('rounds', state.rounds, node.getAttribute('data-id'),
        Number(node.getAttribute('data-dir')))
        .then(function () { return loadEventDetail(state.event.id); })
        .then(draw)
        .catch(fail);
    },

    'round-delete': function (node) {
      if (!confirmed('Delete this round and its songs?')) return;
      q(sb.from('rounds').delete().eq('id', node.getAttribute('data-id')))
        .then(function () { return loadEventDetail(state.event.id); })
        .then(function () { say('Round deleted'); draw(); })
        .catch(fail);
    },

    /* ------------------------------------------------ songs in a round -- */

    'bulk-append': function () { bulkSongs(false); },
    'bulk-replace': function () {
      if (!confirmed('Replace every song in this round with the pasted list?')) return;
      bulkSongs(true);
    },

    'rs-move': function (node) {
      swapPositions('round_songs', state.roundSongs, node.getAttribute('data-id'),
        Number(node.getAttribute('data-dir')))
        .then(function () { return loadRoundSongs(state.round.id); })
        .then(draw)
        .catch(fail);
    },

    'rs-remove': function (node) {
      q(sb.from('round_songs').delete().eq('id', node.getAttribute('data-id')))
        .then(function () { return loadRoundSongs(state.round.id); })
        .then(draw)
        .catch(fail);
    },

    'pick-song': function (node) {
      addSongsToRound([{ id: node.getAttribute('data-id') }]);
    },

    /* ------------------------------------------------------ song list -- */

    'song-add': function () {
      var title = value('new_title');
      if (!title) return say('Add a song title.', true);
      q(sb.from('songs').insert({ title: title, artist: value('new_artist') }))
        .then(loadSongs)
        .then(function () { say('Song added ✓'); draw(); })
        .catch(fail);
    },

    'song-delete': function (node) {
      if (!confirmed('Delete this song? It will be removed from every setlist.')) return;
      q(sb.from('songs').delete().eq('id', node.getAttribute('data-id')))
        .then(loadSongs)
        .then(function () { say('Deleted'); draw(); })
        .catch(fail);
    },

    'songs-import': function () {
      var parsed = parseSongLines(value('bulk_songs'));
      if (!parsed.length) return say('Nothing to import.', true);
      say('Importing ' + parsed.length + ' lines…');
      ensureSongs(parsed)
        .then(function (result) {
          return loadSongs().then(function () {
            say('Added ' + result.added + ' new songs ✓');
            draw();
          });
        })
        .catch(fail);
    },

    /* ------------------------------------------------------------ FAQ -- */

    'faq-add': function () {
      q(sb.from('faqs').insert({
        question: 'New question', answer: '', position: nextPosition(state.faqs)
      }))
        .then(loadFaqs).then(draw).catch(fail);
    },

    'faq-move': function (node) {
      swapPositions('faqs', state.faqs, node.getAttribute('data-id'),
        Number(node.getAttribute('data-dir')))
        .then(loadFaqs).then(draw).catch(fail);
    },

    'faq-delete': function (node) {
      if (!confirmed('Delete this question?')) return;
      q(sb.from('faqs').delete().eq('id', node.getAttribute('data-id')))
        .then(loadFaqs).then(function () { say('Deleted'); draw(); }).catch(fail);
    },

    /* ------------------------------------------------------- requests -- */

    'request-delete': function (node) {
      q(sb.from('song_requests').delete().eq('id', node.getAttribute('data-id')))
        .then(refreshRequests).catch(fail);
    },

    /* ------------------------------------------------------- settings -- */

    'settings-save': function () {
      q(sb.from('site_settings').update({
        instagram: value('instagram'),
        facebook: value('facebook'),
        drive: value('drive'),
        updated_at: new Date().toISOString()
      }).eq('id', true))
        .then(loadSettings)
        .then(function () { say('Saved ✓'); })
        .catch(fail);
    },

    /* ------------------------------------------------- photos on event -- */

    'photo-move': function (node) {
      swapPositions('photos', state.photos, node.getAttribute('data-id'),
        Number(node.getAttribute('data-dir')))
        .then(function () { return loadEventDetail(state.event.id); })
        .then(draw)
        .catch(fail);
    },

    'photo-delete': function (node) {
      if (!confirmed('Remove this photo?')) return;
      q(sb.from('photos').delete().eq('id', node.getAttribute('data-id')))
        .then(function () { return loadEventDetail(state.event.id); })
        .then(function () { say('Removed'); draw(); })
        .catch(fail);
    }
  };

  /* ------------------------------------------------------- bulk songs -- */

  function addSongsToRound(songs) {
    var start = nextPosition(state.roundSongs);
    var rows = songs.map(function (song, i) {
      return { round_id: state.round.id, song_id: song.id, position: start + i };
    });
    return q(sb.from('round_songs').insert(rows))
      .then(function () { return loadRoundSongs(state.round.id); })
      .then(function () { say('Added ' + rows.length + ' songs ✓'); draw(); })
      .catch(fail);
  }

  function bulkSongs(replace) {
    var parsed = parseSongLines(value('bulk'));
    if (!parsed.length) return say('Paste some songs first.', true);

    say('Working through ' + parsed.length + ' songs…');
    var clear = replace
      ? q(sb.from('round_songs').delete().eq('round_id', state.round.id))
        .then(function () { state.roundSongs = []; })
      : Promise.resolve();

    clear
      .then(function () { return ensureSongs(parsed); })
      .then(function (result) { return addSongsToRound(result.songs); })
      .catch(fail);
  }

  /* --------------------------------------------------------- requests -- */

  function refreshRequests() {
    if (!state.requestsFor) {
      state.requests = [];
      return Promise.resolve(draw());
    }
    return q(sb.from('song_requests').select('*')
      .eq('event_id', state.requestsFor)
      .order('created_at', { ascending: false }))
      .then(function (rows) {
        state.requests = rows || [];
        draw();
      })
      .catch(fail);
  }

  /* ------------------------------------------------------------ events -- */

  app.addEventListener('click', function (event) {
    var node = event.target.closest('[data-action]');
    if (!node || !app.contains(node)) return;
    var handler = actions[node.getAttribute('data-action')];
    if (!handler) return;
    event.preventDefault();
    handler(node);
  });

  sessionBar.addEventListener('click', function (event) {
    var node = event.target.closest('[data-action]');
    if (!node) return;
    var handler = actions[node.getAttribute('data-action')];
    if (handler) { event.preventDefault(); handler(node); }
  });

  app.addEventListener('change', function (event) {
    var node = event.target.closest('[data-change]');
    if (!node) return;
    var kind = node.getAttribute('data-change');
    var id = node.getAttribute('data-id');

    if (kind === 'song-edit') {
      var patch = {};
      patch[node.getAttribute('data-part')] = node.value.trim();
      q(sb.from('songs').update(patch).eq('id', id))
        .then(function () { say('Saved ✓'); return loadSongs(); })
        .catch(fail);
    }

    if (kind === 'faq-edit') {
      var faqPatch = {};
      faqPatch[node.getAttribute('data-part')] = node.value;
      q(sb.from('faqs').update(faqPatch).eq('id', id))
        .then(function () { say('Saved ✓'); return loadFaqs(); })
        .catch(fail);
    }

    if (kind === 'photo-alt') {
      q(sb.from('photos').update({ alt: node.value }).eq('id', id))
        .then(function () { say('Saved ✓'); })
        .catch(fail);
    }

    if (kind === 'requests-event') {
      state.requestsFor = node.value;
      refreshRequests();
    }

    if (kind === 'upload-image') {
      var file = node.files && node.files[0];
      if (!file) return;
      say('Uploading…');
      uploadFile(file, state.event.slug || 'events').then(function (url) {
        var target = $('[name="' + node.getAttribute('data-target') + '"]');
        if (target) target.value = url;
        say('Uploaded — now press Save event');
      }).catch(fail);
    }

    if (kind === 'upload-photos') {
      var files = Array.prototype.slice.call(node.files || []);
      if (!files.length) return;
      say('Uploading ' + files.length + ' photos…');

      var position = nextPosition(state.photos);
      files.reduce(function (chain, file, i) {
        return chain.then(function () {
          return uploadFile(file, state.event.slug || 'gallery').then(function (url) {
            return q(sb.from('photos').insert({
              event_id: state.event.id, url: url, alt: '', position: position + i
            }));
          });
        });
      }, Promise.resolve())
        .then(function () { return loadEventDetail(state.event.id); })
        .then(function () { say('Uploaded ' + files.length + ' photos ✓'); draw(); })
        .catch(fail);
    }
  });

  // Live song search inside a round, and filtering the song library.
  app.addEventListener('input', function (event) {
    var node = event.target.closest('[data-input]');
    if (!node) return;

    if (node.getAttribute('data-input') === 'song-search') {
      state.songQuery = node.value;
      var caret = node.selectionStart;
      draw();
      var next = $('[data-input="song-search"]');
      if (next) { next.focus(); next.setSelectionRange(caret, caret); }
    }

    if (node.getAttribute('data-input') === 'pick') {
      var query = node.value.trim().toLowerCase();
      var box = $('.song-results');
      if (!box) return;

      if (query.length < 2) { box.hidden = true; return; }

      var matches = state.songs.filter(function (song) {
        return (song.title + ' ' + song.artist).toLowerCase().indexOf(query) !== -1;
      }).slice(0, 12);

      box.hidden = !matches.length;
      box.innerHTML = matches.map(function (song) {
        return '<button type="button" data-action="pick-song" data-id="' + esc(song.id) + '">' +
          esc(song.title) + ' <em>— ' + esc(song.artist) + '</em></button>';
      }).join('');
    }
  });

  /* -------------------------------------------------------------- boot -- */

  function start() {
    renderSession();
    app.innerHTML = '<p class="admin-hint">Loading content…</p>';

    q(sb.rpc('is_admin')).then(function (isAdmin) {
      if (!isAdmin) {
        app.innerHTML = '<div class="admin-banner admin-banner--warn">' +
          '<strong>Signed in, but this account is not an admin yet.</strong><br>' +
          'In the Supabase SQL editor, run:<br>' +
          '<code>insert into public.admins (user_id, email) select id, email ' +
          'from auth.users where email = \'' + esc(user.email) + '\';</code><br>' +
          'Then reload this page.</div>';
        return null;
      }
      return Promise.all([loadEvents(), loadSongs(), loadFaqs(), loadSettings()])
        .then(function () {
          state.requestsFor = (state.events[0] && state.events[0].id) || '';
          draw();
        });
    }).catch(fail);
  }

  function boot() {
    statusNode = document.createElement('p');
    statusNode.className = 'admin-status';
    statusNode.setAttribute('role', 'status');
    statusNode.setAttribute('aria-live', 'polite');
    app.parentNode.insertBefore(statusNode, app);

    if (!cfg.url || !cfg.key) return renderUnconfigured();
    if (typeof supabase === 'undefined') {
      app.innerHTML = '<div class="admin-banner admin-banner--warn">' +
        'Could not load the Supabase library — check your internet connection ' +
        'and reload.</div>';
      return;
    }

    sb = supabase.createClient(cfg.url, cfg.key);
    sb.auth.getSession().then(function (result) {
      var session = result.data && result.data.session;
      if (session) {
        user = session.user;
        start();
      } else {
        renderLogin();
      }
    }).catch(function (error) {
      // Without this the page would sit on "Loading…" forever whenever the
      // project is unreachable.
      renderLogin('Could not reach the database — ' +
        ((error && error.message) || 'check your connection, then reload.'));
    });
  }

  boot();
})();
