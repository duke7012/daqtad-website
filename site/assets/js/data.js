/* ==========================================================================
   DA'QTAD — site content
   --------------------------------------------------------------------------
   This is the only file you need to edit to update the site.
   Save it, refresh the page, done. No build step, no npm.

   Adding a new event:
     1. Copy one of the blocks in `events` below and change the values.
     2. Put its poster in assets/images/events/ and photos in assets/images/gallery/.
     3. If it needs its own page, copy event-vol-8.html and change the
        data-event="..." value in the <body> tag to the new slug.
   ========================================================================== */

window.SITE = (function () {
  /* ---------------------------------------------------------- contacts -- */

  var social = {
    instagram: 'https://instagram.com/daqtad',
    facebook: 'https://fb.com/daqtad',
    drive: 'https://drive.google.com/drive/folders/1ESfNKgpqy1SydvTTofl5t4PIRBkzRZVd'
  };

  /* ------------------------------------------------------ song requests --
     The request form needs somewhere to send submissions. Pick one:

     a) Formspree (free, 2 min setup): make a form at https://formspree.io,
        then paste the endpoint it gives you, e.g.
        endpoint: 'https://formspree.io/f/abcdwxyz'

     b) Netlify Forms: deploy on Netlify and set endpoint: 'netlify'.

     Leave it as '' and the form still works, but requests are only saved in
     the visitor's own browser (nobody else can see them) — fine for testing.
  ------------------------------------------------------------------------ */

  var requests = {
    endpoint: 'https://formspree.io/f/xjybleya'
  };

  /* ------------------------------------------------------- sample songs --
     Placeholder setlists so the pages look real. Replace each `songs` array
     with your actual playlist: ['Song title', 'Artist'] per line.
  ------------------------------------------------------------------------ */

  var pool = [
    ['Whiplash', 'aespa'], ['APT.', 'ROSÉ & Bruno Mars'], ['How Sweet', 'NewJeans'], ['Magnetic', 'ILLIT'],
    ['Fate', '(G)I-DLE'], ['SPOT!', 'ZICO & JENNIE'], ['Sticky', 'KISS OF LIFE'], ['Chk Chk Boom', 'Stray Kids'],
    ['Armageddon', 'aespa'], ['Igloo', 'KISS OF LIFE'], ['Mantra', 'JENNIE'], ['POWER', 'G-Dragon'],
    ['Supernova', 'aespa'], ['EASY', 'LE SSERAFIM'], ['Deja Vu', 'TXT'], ['Impossible', 'RIIZE'],
    ['SHEESH', 'BABYMONSTER'], ['Super Shy', 'NewJeans'], ['S-Class', 'Stray Kids'], ['I AM', 'IVE'],
    ['Queencard', '(G)I-DLE'], ['Spicy', 'aespa'], ['UNFORGIVEN', 'LE SSERAFIM'], ['Ditto', 'NewJeans'],
    ['Teddy Bear', 'STAYC'], ['Drama', 'aespa'], ['Perfect Night', 'LE SSERAFIM'], ['Standing Next to You', 'Jung Kook'],
    ['Get A Guitar', 'RIIZE'], ['You & Me', 'JENNIE'], ['Love Me Again', 'V'], ['HOT', 'LE SSERAFIM'],
    ['Kill This Love', 'BLACKPINK'], ['How You Like That', 'BLACKPINK'], ['DDU-DU DDU-DU', 'BLACKPINK'],
    ['Pink Venom', 'BLACKPINK'], ['Shut Down', 'BLACKPINK'], ['Lovesick Girls', 'BLACKPINK'],
    ['BOOMBAYAH', 'BLACKPINK'], ['As If It\u2019s Your Last', 'BLACKPINK'],
    ['Dynamite', 'BTS'], ['Butter', 'BTS'], ['Boy With Luv', 'BTS'], ['IDOL', 'BTS'],
    ['FAKE LOVE', 'BTS'], ['DNA', 'BTS'], ['Blood Sweat & Tears', 'BTS'], ['MIC Drop', 'BTS'],
    ['Permission to Dance', 'BTS'],
    ['FANCY', 'TWICE'], ['TT', 'TWICE'], ['LIKEY', 'TWICE'], ['What is Love?', 'TWICE'],
    ['Feel Special', 'TWICE'], ['MORE & MORE', 'TWICE'], ['I CAN\u2019T STOP ME', 'TWICE'],
    ['The Feels', 'TWICE'], ['SET ME FREE', 'TWICE'], ['Cheer Up', 'TWICE'],
    ['Next Level', 'aespa'], ['Savage', 'aespa'], ['Black Mamba', 'aespa'], ['Girls', 'aespa'],
    ['Dun Dun Dance', 'OH MY GIRL'], ['Nonstop', 'OH MY GIRL'], ['Secret Garden', 'OH MY GIRL'],
    ['LOVE DIVE', 'IVE'], ['After LIKE', 'IVE'], ['ELEVEN', 'IVE'], ['Kitsch', 'IVE'],
    ['Baddie', 'IVE'], ['Either Way', 'IVE'],
    ['Attention', 'NewJeans'], ['Hype Boy', 'NewJeans'], ['OMG', 'NewJeans'], ['ETA', 'NewJeans'],
    ['Cookie', 'NewJeans'], ['Bubble Gum', 'NewJeans'],
    ['ANTIFRAGILE', 'LE SSERAFIM'], ['FEARLESS', 'LE SSERAFIM'], ['Smart', 'LE SSERAFIM'], ['CRAZY', 'LE SSERAFIM'],
    ['TOMBOY', '(G)I-DLE'], ['Nxde', '(G)I-DLE'], ['LATATA', '(G)I-DLE'], ['Oh my god', '(G)I-DLE'],
    ['Super Lady', '(G)I-DLE'], ['Klaxon', '(G)I-DLE'],
    ['God\u2019s Menu', 'Stray Kids'], ['Back Door', 'Stray Kids'], ['MANIAC', 'Stray Kids'],
    ['CASE 143', 'Stray Kids'], ['LALALALA', 'Stray Kids'], ['Thunderous', 'Stray Kids'],
    ['Growl', 'EXO'], ['Love Shot', 'EXO'], ['Monster', 'EXO'], ['Ko Ko Bop', 'EXO'],
    ['FANTASTIC BABY', 'BIGBANG'], ['BANG BANG BANG', 'BIGBANG'],
    ['Gangnam Style', 'PSY'], ['That That', 'PSY'],
    ['HIP', 'MAMAMOO'], ['Dingga', 'MAMAMOO'], ['Egotistic', 'MAMAMOO'],
    ['Psycho', 'Red Velvet'], ['Red Flavor', 'Red Velvet'], ['Bad Boy', 'Red Velvet'],
    ['Queendom', 'Red Velvet'], ['Feel My Rhythm', 'Red Velvet'], ['Peek-A-Boo', 'Red Velvet'],
    ['ASAP', 'STAYC'], ['RUN2U', 'STAYC'], ['Stereotype', 'STAYC'],
    ['WANNABE', 'ITZY'], ['DALLA DALLA', 'ITZY'], ['Not Shy', 'ITZY'], ['LOCO', 'ITZY'],
    ['SNEAKERS', 'ITZY'], ['Cheshire', 'ITZY'], ['Born to Be', 'ITZY'],
    ['Bouncy', 'ATEEZ'], ['Wonderland', 'ATEEZ'], ['Say My Name', 'ATEEZ'], ['Guerrilla', 'ATEEZ'],
    ['Cherry Bomb', 'NCT 127'], ['Kick It', 'NCT 127'], ['Sticker', 'NCT 127'],
    ['Hot Sauce', 'NCT DREAM'], ['Ridin\u2019', 'NCT DREAM'], ['Smoothie', 'NCT DREAM'],
    ['Gashina', 'SUNMI'], ['TAIL', 'SUNMI'], ['Cupid', 'FIFTY FIFTY'], ['Rollin\u2019', 'Brave Girls']
  ];

  // Rotates the sample pool so each round looks different. The pool is larger
  // than a round, so no song repeats inside one round. Delete once the real
  // setlists are in.
  function sample(count, offset) {
    var out = [];
    for (var i = 0; i < count; i++) out.push(pool[(i + offset) % pool.length]);
    return out;
  }

  // Builds photo entries: photos('vol-7', 6) -> assets/images/gallery/vol-7-01.jpg ...
  function photos(slug, count, label) {
    var out = [];
    for (var i = 1; i <= count; i++) {
      var n = i < 10 ? '0' + i : String(i);
      out.push({
        src: 'assets/images/gallery/' + slug + '-' + n + '.jpg',
        alt: 'DA\u2019QTAD ' + label + ' \u2014 photo ' + i
      });
    }
    return out;
  }

  /* ------------------------------------------------------------ events --
     Newest first. `status` is 'upcoming' or 'past'.
     `startsAt` must include the timezone offset (-06:00 = Utah, -07:00 in
     winter) so the countdown is correct for visitors anywhere.
  ------------------------------------------------------------------------ */

  var events = [
    {
      slug: 'vol-8',
      status: 'upcoming',
      title: 'RPD Vol. 8 — Neon Nights',
      name: 'RPD Vol. 8',
      subtitle: 'Neon Nights',
      page: 'event-vol-8.html',
      startsAt: '2026-10-17T18:00:00-06:00',
      dateLabel: 'Sat, Oct 17 2026',
      timeLabel: '6:00–9:00 PM',
      venue: 'Liberty Park (east pavilion), Salt Lake City, UT',
      venueShort: 'Liberty Park, SLC',
      badge: 'Upcoming · requests open',
      cta: 'Countdown + song requests →',
      poster: 'assets/images/events/vol-8-poster.jpg',
      posterAlt: 'RPD Vol. 8 Neon Nights event poster',
      cover: 'assets/images/events/vol-8-cover.jpg',
      requestsOpen: true,
      video: '', // YouTube ID or full link, e.g. 'https://youtu.be/xxxxxxxxxxx'
      photos: [],
      rounds: []
    },
    {
      slug: 'vol-7',
      status: 'past',
      title: 'RPD Vol. 7 — Summer Splash',
      name: 'RPD Vol. 7',
      subtitle: 'Summer Splash',
      page: 'event-vol-7.html',
      startsAt: '2026-07-18T18:00:00-06:00',
      dateLabel: 'Jul 18, 2026',
      monthLabel: 'Jul 2026',
      venue: 'Sugar House Park, Salt Lake City, UT',
      venueShort: 'Sugar House Park, SLC',
      stats: '~60 dancers · 3 hours · 3 rounds · 240 songs',
      cta: 'Photos · video · setlist →',
      poster: 'assets/images/events/vol-7-poster.jpg',
      posterAlt: 'RPD Vol. 7 Summer Splash event poster',
      cover: 'assets/images/events/vol-7-cover.jpg',
      video: '',
      photos: photos('vol-7', 8, 'RPD Vol. 7'),
      rounds: [
        { label: 'Round 1 · 6:00 PM', songs: sample(100, 0) },
        { label: 'Round 2 · 7:30 PM', songs: sample(100, 37) },
        { label: 'Finale · 8:30 PM', songs: sample(40, 71) }
      ]
    },
    {
      slug: 'vol-6',
      status: 'past',
      title: 'RPD Vol. 6 — Bloom',
      name: 'RPD Vol. 6',
      subtitle: 'Bloom',
      page: '',
      startsAt: '2026-04-11T18:00:00-06:00',
      dateLabel: 'Apr 11, 2026',
      monthLabel: 'Apr 2026',
      venue: 'Liberty Park, Salt Lake City, UT',
      venueShort: 'Liberty Park, SLC',
      cta: 'Full page coming soon',
      poster: 'assets/images/events/vol-6-poster.jpg',
      posterAlt: 'RPD Vol. 6 Bloom event poster',
      cover: 'assets/images/events/vol-6-cover.jpg',
      video: '',
      photos: photos('vol-6', 6, 'RPD Vol. 6'),
      rounds: [
        { label: 'Round 1', songs: sample(100, 12) },
        { label: 'Round 2', songs: sample(90, 55) }
      ]
    },
    {
      slug: 'vol-5',
      status: 'past',
      title: 'RPD Vol. 5 — Year-End Party',
      name: 'RPD Vol. 5',
      subtitle: 'Year-End Party',
      page: '',
      startsAt: '2025-12-20T18:00:00-07:00',
      dateLabel: 'Dec 20, 2025',
      monthLabel: 'Dec 2025',
      venue: 'Indoor studio, Salt Lake City, UT',
      venueShort: 'Indoor studio, SLC',
      cta: 'Full page coming soon',
      poster: 'assets/images/events/vol-5-poster.jpg',
      posterAlt: 'RPD Vol. 5 Year-End Party event poster',
      cover: 'assets/images/events/vol-5-cover.jpg',
      video: '',
      photos: photos('vol-5', 6, 'RPD Vol. 5'),
      rounds: [
        { label: 'Round 1', songs: sample(100, 24) },
        { label: 'Round 2', songs: sample(100, 83) }
      ]
    },
    {
      slug: 'vol-4',
      status: 'past',
      title: 'RPD Vol. 4 — Homecoming',
      name: 'RPD Vol. 4',
      subtitle: 'Homecoming (Bến Tre)',
      page: '',
      startsAt: '2025-09-06T18:00:00+07:00',
      dateLabel: 'Sep 6, 2025',
      monthLabel: 'Sep 2025',
      venue: 'Bến Tre riverside, Vietnam ✈ farewell RPD',
      venueShort: 'Bến Tre riverside, VN',
      cta: 'Full page coming soon',
      poster: 'assets/images/events/vol-4-poster.jpg',
      posterAlt: 'RPD Vol. 4 Homecoming event poster',
      cover: 'assets/images/events/vol-4-cover.jpg',
      video: '',
      photos: photos('vol-4', 6, 'RPD Vol. 4'),
      rounds: [
        { label: 'Round 1', songs: sample(80, 3) },
        { label: 'Round 2', songs: sample(70, 47) }
      ]
    }
  ];

  /* --------------------------------------------------------------- FAQ -- */

  var faqs = [
    {
      q: 'What is a random play dance (RPD)?',
      a: 'A playlist of K-pop songs plays in short segments in random order. When a song you know comes on, run to the center and dance the choreography. When it ends, run back. Chaos, in the best way.'
    },
    {
      q: 'Do I need to know the full choreography?',
      a: 'Nope! Most people only know the chorus — that is totally fine. Dance what you know, vibe for the rest.'
    },
    {
      q: 'Is it free? Do I need to register?',
      a: 'Always free, no registration. Just show up. Follow @daqtad on Instagram so you know when and where.'
    },
    {
      q: 'How do song requests work?',
      a: 'Before each event we open requests on the event page. The most-requested songs make the playlist. One request per song, but you can request as many songs as you like.'
    },
    {
      q: 'Can I get the photos from an event?',
      a: 'Yes! Every event page has an album link, and everything lives in our shared Google Drive — free to download and post (tag us 💜).'
    }
  ];

  return {
    social: social,
    requests: requests,
    events: events,
    faqs: faqs,

    // Helpers used by site.js
    get: function (slug) {
      for (var i = 0; i < events.length; i++) if (events[i].slug === slug) return events[i];
      return null;
    },
    upcoming: function () {
      for (var i = 0; i < events.length; i++) if (events[i].status === 'upcoming') return events[i];
      return null;
    },
    past: function () {
      return events.filter(function (e) { return e.status !== 'upcoming'; });
    }
  };
})();
