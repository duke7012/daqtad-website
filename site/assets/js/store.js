/* ==========================================================================
   DA'QTAD — content loader
   --------------------------------------------------------------------------
   Fetches events, setlists, photos and FAQs from Supabase and hands site.js
   exactly the same shape data.js used to provide, so the rendering code did
   not have to change.

   Order of preference:
     1. the database (fresh)
     2. the last successful response, cached in this browser
     3. the sample content in data.js

   Uses plain fetch against Supabase's REST API — visitors never download an
   SDK. Only the admin page loads the Supabase library.
   ========================================================================== */

window.SITE_STORE = (function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var configured = !!(cfg.url && cfg.key);
  var CACHE_KEY = 'daqtad-content-v1';
  var TIMEOUT = 8000;

  /* ------------------------------------------------------------- fetch --- */

  function rest(path, options) {
    var opts = options || {};
    var headers = {
      apikey: cfg.key,
      Authorization: 'Bearer ' + cfg.key,
      Accept: 'application/json'
    };
    if (opts.body) headers['Content-Type'] = 'application/json';
    if (opts.prefer) headers.Prefer = opts.prefer;

    return fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/' + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (text) {
          throw new Error('Supabase ' + response.status + ': ' + text);
        });
      }
      return response.status === 204 ? null : response.json();
    });
  }

  function withTimeout(promise) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        reject(new Error('Database request timed out'));
      }, TIMEOUT);
      promise.then(function (value) {
        clearTimeout(timer);
        resolve(value);
      }, function (error) {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  /* ------------------------------------------------------------ format --- */

  function byPosition(a, b) {
    return (a.position || 0) - (b.position || 0);
  }

  function formatDate(iso, timezone, options) {
    if (!iso) return '';
    try {
      var opts = { timeZone: timezone || 'America/Denver' };
      for (var key in options) opts[key] = options[key];
      return new Intl.DateTimeFormat('en-US', opts).format(new Date(iso));
    } catch (err) {
      return '';
    }
  }

  // "6:00–9:00 PM" when both times share a meridiem, "11:00 AM–1:00 PM" otherwise.
  function timeLabel(startIso, endIso, timezone) {
    var clock = { hour: 'numeric', minute: '2-digit' };
    var start = formatDate(startIso, timezone, clock);
    if (!start) return '';
    if (!endIso) return start;

    var end = formatDate(endIso, timezone, clock);
    if (!end) return start;

    var startMeridiem = start.slice(-2);
    if (startMeridiem === end.slice(-2)) {
      return start.replace(/\s*[AP]M$/, '') + '–' + end;
    }
    return start + '–' + end;
  }

  function mapEvent(row) {
    var title = row.name + (row.subtitle ? ' — ' + row.subtitle : '');

    var rounds = (row.rounds || []).slice().sort(byPosition).map(function (round) {
      var songs = (round.round_songs || []).slice().sort(byPosition)
        .filter(function (entry) { return entry.songs; })
        .map(function (entry) { return [entry.songs.title, entry.songs.artist]; });
      return { label: round.label, songs: songs };
    });

    var photos = (row.photos || []).slice().sort(byPosition).map(function (photo, i) {
      return { src: photo.url, alt: photo.alt || title + ' — photo ' + (i + 1) };
    });

    return {
      id: row.id,
      slug: row.slug,
      status: row.status,
      title: title,
      name: row.name,
      subtitle: row.subtitle || '',
      page: row.page || 'event.html?slug=' + encodeURIComponent(row.slug),
      startsAt: row.starts_at || '',
      dateLabel: formatDate(row.starts_at, row.timezone, {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      }),
      monthLabel: formatDate(row.starts_at, row.timezone, {
        month: 'short', year: 'numeric'
      }),
      timeLabel: timeLabel(row.starts_at, row.ends_at, row.timezone),
      venue: row.venue || '',
      venueShort: row.venue_short || row.venue || '',
      badge: row.badge || '',
      cta: row.cta || '',
      stats: row.stats || '',
      poster: row.poster_url || '',
      posterAlt: title + ' event poster',
      cover: row.cover_url || '',
      requestsOpen: !!row.requests_open,
      video: row.video || '',
      photos: photos,
      rounds: rounds
    };
  }

  // Wraps the plain arrays in the helper API that site.js expects.
  function build(events, faqs, settings) {
    return {
      source: 'database',
      social: {
        instagram: (settings && settings.instagram) || '',
        facebook: (settings && settings.facebook) || '',
        drive: (settings && settings.drive) || ''
      },
      requests: { endpoint: '' },
      events: events,
      faqs: faqs,
      get: function (slug) {
        for (var i = 0; i < events.length; i++) {
          if (events[i].slug === slug) return events[i];
        }
        return null;
      },
      upcoming: function () {
        for (var i = 0; i < events.length; i++) {
          if (events[i].status === 'upcoming') return events[i];
        }
        return null;
      },
      past: function () {
        return events.filter(function (ev) { return ev.status !== 'upcoming'; });
      }
    };
  }

  /* ------------------------------------------------------------- cache --- */

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.events) return null;
      return build(parsed.events, parsed.faqs || [], parsed.settings);
    } catch (err) {
      return null;
    }
  }

  function writeCache(events, faqs, settings) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        events: events, faqs: faqs, settings: settings, savedAt: Date.now()
      }));
    } catch (err) { /* storage full or blocked — not worth failing over */ }
  }

  /* -------------------------------------------------------------- load --- */

  var SELECT = 'select=*,rounds(id,label,position,round_songs(position,songs(title,artist)))' +
    ',photos(id,url,alt,position)';

  function loadFromDatabase() {
    return Promise.all([
      rest('events?' + SELECT + '&order=position.desc'),
      rest('faqs?select=question,answer,position&order=position.asc'),
      rest('site_settings?select=*&limit=1')
    ]).then(function (results) {
      var events = results[0].map(mapEvent);
      var faqs = results[1].map(function (row) {
        return { q: row.question, a: row.answer };
      });
      var settings = results[2] && results[2][0];

      writeCache(events, faqs, settings);
      return build(events, faqs, settings);
    });
  }

  function load() {
    if (!configured) {
      var fallback = window.SITE;
      fallback.source = 'sample';
      return Promise.resolve(fallback);
    }

    return withTimeout(loadFromDatabase()).catch(function (error) {
      if (window.console) console.warn('[daqtad] using offline content —', error.message);
      var cached = readCache();
      if (cached) {
        cached.source = 'cache';
        return cached;
      }
      var sample = window.SITE;
      sample.source = 'sample';
      return sample;
    });
  }

  /* ---------------------------------------------------- song requests --- */

  function listRequests(eventId) {
    if (!configured || !eventId) return Promise.resolve(null);
    return rest('song_requests?select=*&event_id=eq.' + encodeURIComponent(eventId) +
      '&order=created_at.desc&limit=200');
  }

  function addRequest(eventId, entry) {
    if (!configured || !eventId) return Promise.reject(new Error('not configured'));
    return rest('song_requests', {
      method: 'POST',
      prefer: 'return=representation',
      body: {
        event_id: eventId,
        name: entry.name,
        song: entry.song,
        artist: entry.artist,
        part: entry.time,
        link: entry.link
      }
    });
  }

  return {
    configured: configured,
    load: load,
    listRequests: listRequests,
    addRequest: addRequest
  };
})();
