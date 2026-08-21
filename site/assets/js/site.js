/* ==========================================================================
   DA'QTAD — site behaviour
   Plain browser JavaScript, no framework and no build step.
   Content comes from store.js (the database, with data.js as a fallback);
   this file only renders it and wires up the interactions.
   ========================================================================== */

(function () {
  'use strict';

  var D = null; // filled in by boot() once the content has loaded

  /* --------------------------------------------------------- utilities -- */

  var ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return ENTITIES[c];
    });
  }

  function $(selector, root) { return (root || document).querySelector(selector); }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  /* ------------------------------------------------------------- media --
     Renders an image that falls back to a labelled placeholder box when the
     file is missing, so the site never shows a broken-image icon.
  ------------------------------------------------------------------------ */

  function media(src, alt, placeholder, modifier) {
    var cls = 'media' + (modifier ? ' ' + modifier : '');
    var attrs = 'class="' + cls + '" data-placeholder="' + esc(placeholder || 'Photo coming soon') + '"';
    if (!src) return '<div ' + attrs + ' data-empty></div>';
    return '<div ' + attrs + '><img src="' + esc(src) + '" alt="' + esc(alt || '') +
      '" loading="lazy" decoding="async"></div>';
  }

  function markEmpty(img) {
    var box = img.closest('.media');
    if (!box) return;
    box.setAttribute('data-empty', '');
    var tile = box.closest('.tile');
    if (tile) tile.disabled = true;
  }

  function initMedia(root) {
    $$('.media img', root).forEach(function (img) {
      if (img.dataset.bound) return;
      img.dataset.bound = '1';
      img.addEventListener('error', function () { markEmpty(img); });
      img.addEventListener('load', function () {
        var box = img.closest('.media');
        if (box) box.removeAttribute('data-empty');
      });
      if (img.complete && img.naturalWidth === 0) markEmpty(img);
    });
  }

  /* --------------------------------------------------------- chrome ----- */

  function initChrome() {
    $$('[data-year]').forEach(function (node) {
      node.textContent = String(new Date().getFullYear());
    });

    var toggle = $('.nav-toggle');
    var nav = $('.nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.hasAttribute('data-open');
      if (open) nav.removeAttribute('data-open');
      else nav.setAttribute('data-open', '');
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  /* ------------------------------------------------------- countdowns --- */

  function initCountdowns() {
    var blocks = $$('[data-countdown]');
    if (!blocks.length) return;

    function tick() {
      blocks.forEach(function (block) {
        var target = new Date(block.getAttribute('data-countdown')).getTime();
        var left = Math.max(0, target - Date.now());
        if (left === 0) block.setAttribute('data-done', '');

        var days = Math.floor(left / 864e5); left -= days * 864e5;
        var hours = Math.floor(left / 36e5); left -= hours * 36e5;
        var mins = Math.floor(left / 6e4); left -= mins * 6e4;
        var secs = Math.floor(left / 1e3);

        var values = { d: String(days), h: pad(hours), m: pad(mins), s: pad(secs) };
        $$('[data-unit]', block).forEach(function (node) {
          var next = values[node.getAttribute('data-unit')];
          if (node.textContent !== next) node.textContent = next;
        });
      });
    }

    tick();
    setInterval(tick, 1000);
  }

  /* --------------------------------------------------------- lightbox --- */

  var lightbox = {
    items: [],
    index: 0,
    root: null,

    build: function () {
      if (this.root) return;
      var box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.setAttribute('aria-label', 'Photo viewer');
      box.innerHTML =
        '<button class="lightbox__btn lightbox__btn--close" aria-label="Close">✕</button>' +
        '<button class="lightbox__btn lightbox__btn--prev" aria-label="Previous photo">‹</button>' +
        '<img alt="">' +
        '<button class="lightbox__btn lightbox__btn--next" aria-label="Next photo">›</button>' +
        '<p class="lightbox__caption"></p>';
      document.body.appendChild(box);
      this.root = box;

      var self = this;
      $('.lightbox__btn--close', box).addEventListener('click', function () { self.close(); });
      $('.lightbox__btn--prev', box).addEventListener('click', function () { self.step(-1); });
      $('.lightbox__btn--next', box).addEventListener('click', function () { self.step(1); });
      box.addEventListener('click', function (event) {
        if (event.target === box) self.close();
      });
      document.addEventListener('keydown', function (event) {
        if (!box.hasAttribute('open')) return;
        if (event.key === 'Escape') self.close();
        if (event.key === 'ArrowLeft') self.step(-1);
        if (event.key === 'ArrowRight') self.step(1);
      });
    },

    open: function (items, index) {
      this.build();
      this.items = items;
      this.index = index;
      this.show();
      this.root.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
    },

    show: function () {
      var item = this.items[this.index];
      $('img', this.root).src = item.src;
      $('img', this.root).alt = item.alt || '';
      $('.lightbox__caption', this.root).textContent =
        (this.index + 1) + ' / ' + this.items.length + (item.alt ? ' · ' + item.alt : '');
    },

    step: function (delta) {
      this.index = (this.index + delta + this.items.length) % this.items.length;
      this.show();
    },

    close: function () {
      this.root.removeAttribute('open');
      document.body.style.overflow = '';
    }
  };

  function bindTiles(container, items) {
    container.addEventListener('click', function (event) {
      var tile = event.target.closest('.tile');
      if (!tile || tile.disabled) return;
      lightbox.open(items, Number(tile.getAttribute('data-index')));
    });
  }

  /* --------------------------------------------------------- setlists --
     A round runs to roughly 100 songs, so lists are never put inside a
     fixed-height scrollbox. The overview page shows a short preview that
     expands in place; a full list gets a search box instead.
  ------------------------------------------------------------------------ */

  var PREVIEW_SONGS = 12;

  function padTo(n, width) {
    var out = String(n);
    while (out.length < width) out = '0' + out;
    return out;
  }

  function totalSongs(ev) {
    return ev.rounds.reduce(function (sum, round) { return sum + round.songs.length; }, 0);
  }

  // Keeps each song's position in the round so numbering stays correct when
  // the list is filtered or previewed.
  function roundEntries(round) {
    return round.songs.map(function (song, i) {
      return { n: i + 1, song: song[0], artist: song[1] };
    });
  }

  function songRows(entries, width) {
    return entries.map(function (entry) {
      return '<li class="song">' +
        '<span class="song__n">' + padTo(entry.n, width) + '</span>' +
        '<span class="song__title">' + esc(entry.song) + '</span>' +
        '<span class="song__artist">' + esc(entry.artist) + '</span>' +
        '</li>';
    }).join('');
  }

  function mountSetlist(root, ev, mode) {
    var isFull = mode === 'full';
    var state = { round: 0, expanded: false, query: '' };

    root.classList.add('setlist', isFull ? 'setlist--full' : 'setlist--preview');

    var tabs = ev.rounds.map(function (round, i) {
      return '<button class="tab" type="button" role="tab" data-round="' + i + '"' +
        ' aria-selected="' + (i === 0) + '">' + esc(round.label) +
        ' <span class="tab__count">' + round.songs.length + '</span></button>';
    }).join('');

    root.innerHTML =
      '<div class="setlist-toolbar">' +
        '<div class="tabs" role="tablist">' + tabs + '</div>' +
        (isFull
          ? '<input class="setlist-search" type="search" placeholder="Search this round…"' +
            ' aria-label="Search songs in this round">'
          : '') +
      '</div>' +
      '<div class="setlist-body"></div>';

    var body = $('.setlist-body', root);

    function draw() {
      var round = ev.rounds[state.round];
      var all = roundEntries(round);
      var width = String(round.songs.length).length;
      var query = state.query.trim().toLowerCase();

      var matches = !query ? all : all.filter(function (entry) {
        return (entry.song + ' ' + entry.artist).toLowerCase().indexOf(query) !== -1;
      });

      if (!matches.length) {
        body.innerHTML = '<p class="setlist-note">No song in this round matches “' +
          esc(state.query.trim()) + '”.</p>';
        return;
      }

      var truncated = !isFull && !state.expanded && matches.length > PREVIEW_SONGS;
      var shown = truncated ? matches.slice(0, PREVIEW_SONGS) : matches;

      var note = '';
      if (query) {
        note = '<p class="setlist-note">' + matches.length + ' of ' + round.songs.length +
          ' songs match.</p>';
      } else if (truncated) {
        note = '<p class="setlist-note">Showing the first ' + PREVIEW_SONGS + ' of ' +
          round.songs.length + ' songs.</p>';
      }

      var actions = '';
      if (!isFull && (truncated || state.expanded)) {
        actions = '<button class="setlist-toggle" type="button" data-toggle>' +
          (truncated ? 'Show all ' + round.songs.length + ' songs ↓' : 'Show fewer ↑') +
          '</button>' +
          (ev.page
            ? '<a class="link-strong" href="' + esc(ev.page) + '">Event page →</a>'
            : '');
      }

      body.innerHTML =
        note +
        '<ol class="songs">' + songRows(shown, width) + '</ol>' +
        (actions ? '<div class="setlist-actions">' + actions + '</div>' : '');
    }

    root.addEventListener('click', function (event) {
      var tab = event.target.closest('.tab');
      if (tab) {
        state.round = Number(tab.getAttribute('data-round'));
        state.expanded = false;
        $$('.tab', root).forEach(function (node) {
          node.setAttribute('aria-selected', String(node === tab));
        });
        draw();
        return;
      }

      if (event.target.closest('[data-toggle]')) {
        state.expanded = !state.expanded;
        draw();
      }
    });

    if (isFull) {
      $('.setlist-search', root).addEventListener('input', function (event) {
        state.query = event.target.value;
        draw();
      });
    }

    draw();
  }

  /* ------------------------------------------------------ page: home ---- */

  function renderNextEvent(host) {
    var ev = D.upcoming();
    if (!ev) { host.remove(); return; }

    host.innerHTML =
      '<a class="next-card" href="' + esc(ev.page || 'events.html') + '">' +
        '<div class="next-card__body">' +
          '<span class="eyebrow">★ Up next</span>' +
          '<div class="next-card__title">' + esc(ev.title) + '</div>' +
          '<div class="next-card__meta">' + esc(ev.dateLabel + ' · ' + ev.timeLabel + ' · ' + ev.venue) + '</div>' +
          (ev.requestsOpen ? '<div class="next-card__cta">Song requests are open → tap to request</div>' : '') +
        '</div>' +
        '<div class="countdown" data-countdown="' + esc(ev.startsAt) + '">' +
          '<div class="cd-unit"><b data-unit="d">–</b><span>DAYS</span></div>' +
          '<div class="cd-unit"><b data-unit="h">–</b><span>HRS</span></div>' +
          '<div class="cd-unit"><b data-unit="m">–</b><span>MIN</span></div>' +
          '<div class="cd-unit"><b data-unit="s">–</b><span>SEC</span></div>' +
        '</div>' +
      '</a>';
  }

  function renderRecentEvents(host) {
    host.innerHTML = D.past().slice(0, 3).map(function (ev) {
      return '<a class="event-card" href="' + esc(ev.page || 'gallery.html') + '">' +
        '<div class="event-card__media">' +
          media(ev.cover, ev.title + ' cover photo', ev.name + ' cover photo') +
        '</div>' +
        '<div class="event-card__body">' +
          '<span class="eyebrow event-card__date">' + esc(ev.dateLabel) + '</span>' +
          '<div class="event-card__title">' + esc(ev.title) + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  /* ---------------------------------------------------- page: events ---- */

  function renderEventList(host) {
    host.innerHTML = D.events.map(function (ev) {
      var upcoming = ev.status === 'upcoming';
      var href = ev.page || 'gallery.html';
      var badge = upcoming
        ? '<span class="tag tag--live">' + esc(ev.badge || 'Upcoming') + '</span>'
        : '<span class="tag tag--past">' + esc(ev.dateLabel) + '</span>';

      return '<a class="event-row' + (upcoming ? ' event-row--featured' : '') + '" href="' + esc(href) + '">' +
        '<div class="event-row__media">' +
          media(ev.poster, ev.posterAlt, ev.name + ' poster', upcoming ? 'media--dark' : '') +
        '</div>' +
        '<div class="event-row__body">' +
          badge +
          '<div class="event-row__title">' + esc(ev.title) + '</div>' +
          '<div class="event-row__venue">' +
            esc(upcoming ? ev.dateLabel + ' · ' + ev.timeLabel + ' · ' + ev.venue : ev.venue) +
          '</div>' +
          '<div class="event-row__cta">' + esc(ev.cta || 'View event →') + '</div>' +
        '</div>' +
      '</a>';
    }).join('');
  }

  /* --------------------------------------------------- page: gallery ---- */

  function renderGallery(host) {
    var groups = D.past().filter(function (ev) { return ev.photos && ev.photos.length; });

    if (!groups.length) {
      host.innerHTML = '<div class="notice notice--plain">No photos uploaded yet — ' +
        'add them from the admin page and they will appear here. 📷</div>';
      return;
    }

    host.innerHTML = groups.map(function (ev, gi) {
      var tiles = ev.photos.map(function (photo, i) {
        return '<button class="tile" type="button" data-index="' + i + '"' +
          ' aria-label="Open ' + esc(photo.alt) + '">' +
          media(photo.src, photo.alt, 'photo ' + (i + 1)) +
          '</button>';
      }).join('');

      return '<section class="section gallery-group" data-group="' + gi + '">' +
        '<div class="gallery-group__head">' +
          '<h2>' + esc(ev.subtitle ? ev.name + ' — ' + ev.subtitle : ev.title) + '</h2>' +
          '<span class="eyebrow">' + esc(ev.monthLabel || ev.dateLabel) + '</span>' +
        '</div>' +
        '<div class="photo-grid">' + tiles + '</div>' +
      '</section>';
    }).join('');

    groups.forEach(function (ev, gi) {
      var grid = $('[data-group="' + gi + '"] .photo-grid', host);
      if (grid) bindTiles(grid, ev.photos);
    });
  }

  /* -------------------------------------------------- page: setlists ---- */

  function renderSetlists(host) {
    var withLists = D.past().filter(function (ev) { return ev.rounds && ev.rounds.length; });

    host.innerHTML = withLists.map(function (ev, i) {
      return '<article class="setlist-card" data-setlist="' + i + '">' +
        '<div class="setlist-card__head">' +
          '<h2>' + esc(ev.subtitle ? ev.name + ' — ' + ev.subtitle : ev.title) + '</h2>' +
          '<span class="setlist-card__meta">' + esc(ev.monthLabel || ev.dateLabel) +
            ' · ' + ev.rounds.length + ' rounds · ' + totalSongs(ev) + ' songs</span>' +
        '</div>' +
        '<div class="setlist-mount"></div>' +
      '</article>';
    }).join('');

    withLists.forEach(function (ev, i) {
      mountSetlist($('[data-setlist="' + i + '"] .setlist-mount', host), ev, 'preview');
    });
  }

  /* ----------------------------------------------- page: single event --- */

  // Header for the generic event.html. The hand-written event pages have this
  // markup written out in the HTML instead, so they skip this.
  function renderEventHead(host, ev) {
    var upcoming = ev.status === 'upcoming';
    var when = [ev.dateLabel, ev.timeLabel].filter(Boolean).join(' · ');

    var facts = [];
    if (when) facts.push('📅 ' + esc(when));
    if (ev.venue) facts.push('📍 ' + esc(ev.venue));
    if (ev.stats) facts.push('💃 ' + esc(ev.stats));

    var social = '';
    if (D.social.instagram) {
      social += '<a class="btn btn--outline btn--sm btn--icon" href="' + esc(D.social.instagram) +
        '" target="_blank" rel="noopener">' +
        '<span class="icon icon--instagram" aria-hidden="true"></span>Instagram</a>';
    }
    if (D.social.facebook) {
      social += '<a class="btn btn--outline btn--sm btn--icon" href="' + esc(D.social.facebook) +
        '" target="_blank" rel="noopener">' +
        '<span class="icon icon--facebook" aria-hidden="true"></span>Photo album</a>';
    }

    host.innerHTML =
      '<span class="tag ' + (upcoming ? 'tag--live' : 'tag--past') + '">' +
        esc(upcoming ? (ev.badge || 'Upcoming') : 'Past event · ' + ev.dateLabel) +
      '</span>' +
      '<h1 class="event-hero__title">' + esc(ev.name) +
        (ev.subtitle ? '<br><span>' + esc(ev.subtitle) + '</span>' : '') +
      '</h1>' +
      (facts.length ? '<p class="event-facts">' + facts.join('<br>') + '</p>' : '') +
      (upcoming && ev.startsAt
        ? '<div class="countdown" data-countdown="' + esc(ev.startsAt) + '">' +
            '<div class="cd-unit"><b data-unit="d">–</b><span>DAYS</span></div>' +
            '<div class="cd-unit"><b data-unit="h">–</b><span>HRS</span></div>' +
            '<div class="cd-unit"><b data-unit="m">–</b><span>MIN</span></div>' +
            '<div class="cd-unit"><b data-unit="s">–</b><span>SEC</span></div>' +
          '</div>'
        : '') +
      (social ? '<div class="btn-row">' + social + '</div>' : '');

    document.title = ev.title + " · DA'QTAD";
  }

  // Drops the sections of the generic page that this event has nothing for.
  function trimEventSections(ev) {
    var filled = {
      video: !!ev.video,
      photos: !!(ev.photos && ev.photos.length),
      setlist: !!(ev.rounds && ev.rounds.length),
      requests: !!ev.requestsOpen
    };
    $$('[data-optional]').forEach(function (section) {
      if (!filled[section.getAttribute('data-optional')]) section.remove();
    });
  }

  function renderEventPage(ev) {
    var head = $('[data-render="event-head"]');
    if (head) {
      renderEventHead(head, ev);
      trimEventSections(ev);
    }

    var poster = $('[data-render="poster"]');
    if (poster) {
      poster.innerHTML = media(ev.poster, ev.posterAlt, ev.name + ' event poster (4:5)',
        ev.status === 'upcoming' ? 'media--dark' : '');
    }

    var video = $('[data-render="video"]');
    if (video) {
      if (ev.video) {
        var id = ev.video.indexOf('http') === 0
          ? (ev.video.split(/[/=]/).pop() || '')
          : ev.video;
        video.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(id) +
          '" title="' + esc(ev.title) + ' recap video" allowfullscreen' +
          ' allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"></iframe>';
      } else {
        video.innerHTML = '<div class="video-frame__empty">▶️<span>Recap video coming soon</span>' +
          '<small>add the YouTube link on the admin page</small></div>';
      }
    }

    var photoHost = $('[data-render="photos"]');
    if (photoHost && ev.photos && ev.photos.length) {
      photoHost.innerHTML = ev.photos.map(function (photo, i) {
        return '<button class="tile" type="button" data-index="' + i + '"' +
          ' aria-label="Open ' + esc(photo.alt) + '">' +
          media(photo.src, photo.alt, ev.name + ' photo ' + (i + 1)) +
          '</button>';
      }).join('');
      bindTiles(photoHost, ev.photos);
    }

    var setlist = $('[data-render="setlist"]');
    if (setlist && ev.rounds && ev.rounds.length) {
      mountSetlist(setlist, ev, 'full');
    }

    initRequests(ev);
  }

  /* --------------------------------------------------- song requests ---- */

  // Requests go to the database when it is connected, so everyone sees the
  // same list. Without a database they fall back to this browser only.
  var useDatabase = window.SITE_STORE.configured;

  function storageKey(ev) { return 'daqtad-requests-' + ev.slug; }

  function readRequests(ev) {
    try {
      return JSON.parse(localStorage.getItem(storageKey(ev)) || '[]');
    } catch (err) {
      return [];
    }
  }

  function writeRequests(ev, list) {
    try {
      localStorage.setItem(storageKey(ev), JSON.stringify(list));
    } catch (err) { /* private browsing — the request was still sent */ }
  }

  function fetchRequests(ev) {
    if (!useDatabase || !ev.id) return Promise.resolve(readRequests(ev));
    return window.SITE_STORE.listRequests(ev.id).then(function (rows) {
      return (rows || []).map(function (row) {
        return {
          name: row.name, song: row.song, artist: row.artist,
          time: row.part, link: row.link
        };
      });
    }).catch(function () { return readRequests(ev); });
  }

  function paintRequests(list, host, countNode) {
    if (countNode) countNode.textContent = String(list.length);

    if (!list.length) {
      host.innerHTML = '<div class="notice notice--plain">No requests yet — be the first! ✨</div>';
      return;
    }

    host.innerHTML = '<div class="request-list">' + list.map(function (r) {
      var link = /^https?:\/\//.test(r.link || '')
        ? '<a href="' + esc(r.link) + '" target="_blank" rel="noopener">▶ dance practice ↗</a>'
        : '';
      return '<div class="request">' +
        '<div class="request__top">' +
          '<div><span class="request__song">' + esc(r.song) + '</span> ' +
          '<span class="request__artist">— ' + esc(r.artist) + '</span></div>' +
          '<span class="request__by">' + esc(r.name) + '</span>' +
        '</div>' +
        '<div class="request__meta"><span>⏱ ' + esc(r.time) + '</span>' + link + '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function initRequests(ev) {
    var form = $('#request-form');
    if (!form) return;

    var host = $('[data-render="requests"]');
    var countNode = $('[data-request-count]');
    var status = $('.form__status', form);
    var button = $('button[type="submit"]', form);
    var endpoint = (D.requests && D.requests.endpoint) || '';

    function refresh() {
      if (!host) return;
      fetchRequests(ev).then(function (list) { paintRequests(list, host, countNode); });
    }

    if (!ev.requestsOpen) {
      form.innerHTML = '<div class="notice">Song requests are closed for this event 💜 ' +
        'See you on the dance floor!</div>';
      refresh();
      return;
    }

    refresh();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var entry = {
        name: (data.get('name') || '').trim() || 'anon',
        song: (data.get('song') || '').trim(),
        artist: (data.get('artist') || '').trim() || '—',
        time: (data.get('time') || '').trim() || 'any part',
        link: (data.get('link') || '').trim()
      };

      if (!entry.song) {
        status.textContent = 'Please add a song title.';
        status.setAttribute('data-error', '');
        return;
      }

      status.removeAttribute('data-error');

      function done(message, failed) {
        status.textContent = message;
        if (failed) status.setAttribute('data-error', '');
        form.reset();
        button.disabled = false;
        button.textContent = 'Send request →';
      }

      button.disabled = true;
      button.textContent = 'Sending…';

      if (useDatabase && ev.id) {
        window.SITE_STORE.addRequest(ev.id, entry)
          .then(function () {
            done('Requested! 💜 Thanks — we read every one.');
            refresh();
          })
          .catch(function () {
            done('Could not send right now — please DM us on Instagram instead.', true);
          });
        return;
      }

      // No database connected: keep the request on this device, and post it to
      // a form service if one is configured in data.js.
      writeRequests(ev, [entry].concat(readRequests(ev)));
      refresh();

      if (!endpoint) {
        done('Saved on this device 💜 (connect the database to collect these for real)');
        return;
      }

      var url = endpoint === 'netlify' ? location.pathname : endpoint;
      var options = endpoint === 'netlify'
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data).toString()
          }
        : {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: data
          };

      fetch(url, options)
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed');
          done('Requested! 💜 Thanks — we read every one.');
        })
        .catch(function () {
          done('Could not send right now — please DM us on Instagram instead.', true);
        });
    });
  }

  /* ------------------------------------------------------------- FAQ ---- */

  function renderFaqs(host) {
    host.innerHTML = D.faqs.map(function (faq) {
      return '<details><summary>' + esc(faq.q) + '</summary><p>' + esc(faq.a) + '</p></details>';
    }).join('');
  }

  /* ------------------------------------------------------------- boot --- */

  function eventNotFound(slug) {
    var main = $('#main');
    if (!main) return;
    main.innerHTML = '<section class="section section--narrow">' +
      '<a class="link-strong" href="events.html">← All events</a>' +
      '<h1 class="event-hero__title">Event not found</h1>' +
      '<p class="lede">There is no event called “' + esc(slug) + '”. ' +
      'It may have been renamed or removed.</p>' +
      '<div class="btn-row"><a class="btn btn--primary" href="events.html">See all events</a></div>' +
      '</section>';
  }

  function render() {
    var page = document.body.getAttribute('data-page');

    if (page === 'home') {
      var next = $('[data-render="next-event"]');
      if (next) renderNextEvent(next);
      var recent = $('[data-render="recent-events"]');
      if (recent) renderRecentEvents(recent);
    }

    if (page === 'events') renderEventList($('[data-render="event-list"]'));
    if (page === 'gallery') renderGallery($('[data-render="gallery"]'));
    if (page === 'setlists') renderSetlists($('[data-render="setlists"]'));

    if (page === 'about') {
      var faqHost = $('[data-render="faqs"]');
      if (faqHost) renderFaqs(faqHost);
    }

    if (page === 'event') {
      // Hand-written pages name their event in the body tag; the generic
      // event.html takes it from ?slug=... instead.
      var slug = document.body.getAttribute('data-event') ||
        new URLSearchParams(location.search).get('slug') || '';
      var ev = D.get(slug);
      if (ev) renderEventPage(ev);
      else eventNotFound(slug);
    }

    initMedia(document);
    initCountdowns();
  }

  function boot() {
    initChrome();
    window.SITE_STORE.load().then(function (data) {
      D = data;
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
