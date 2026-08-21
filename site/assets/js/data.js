/* ==========================================================================
   DA'QTAD — fallback content
   --------------------------------------------------------------------------
   The site is edited at /admin.html and reads from the database. You do not
   need to touch this file.

   It is the safety net: if the database is unreachable and the visitor has no
   cached copy, the site shows this instead of an empty page. It holds the
   content as it was before the database was set up.
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
        src: '/assets/images/gallery/' + slug + '-' + n + '.jpg',
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
      slug: 'popup',
      status: 'upcoming',
      title: 'Spin-Off (Pop-Up) — Bopsim Korean Festival',
      name: 'Spin-Off (Pop-Up)',
      subtitle: 'Bopsim Korean Festival',
      page: '/events/popup',
      startsAt: '2026-09-11T16:00:00-06:00',
      dateLabel: 'Fri, Sep 11 2026',
      timeLabel: '4:00–9:00 PM',
      venue: 'Bopsim Korean Festival, University of Utah, Salt Lake City, UT',
      venueShort: 'Bopsim Korean Festival, U of U',
      badge: 'Upcoming · requests open',
      cta: 'Countdown + song requests →',
      poster: '/assets/images/events/popup-poster.jpg',
      posterAlt: 'Spin-Off (Pop-Up) at Bopsim Korean Festival event poster',
      cover: '/assets/images/events/popup-cover.jpg',
      requestsOpen: true,
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rpd-ut2',
      status: 'past',
      title: '#RPD_UT2 — Season\'s Greetings',
      name: '#RPD_UT2',
      subtitle: 'Season\'s Greetings',
      page: '',
      startsAt: '2026-01-10T18:00:00-07:00',
      dateLabel: 'Sat, Jan 10 2026',
      monthLabel: 'Jan 2026',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rpd-ut2-poster.jpg',
      posterAlt: '#RPD_UT2 Season\'s Greetings event poster',
      cover: '/assets/images/events/rpd-ut2-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rpd-ut1',
      status: 'past',
      title: '#RPD_UT1 — Back To School Fall 2025',
      name: '#RPD_UT1',
      subtitle: 'Back To School Fall 2025',
      page: '',
      startsAt: '2025-08-16T18:00:00-06:00',
      dateLabel: 'Sat, Aug 16 2025',
      monthLabel: 'Aug 2025',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rpd-ut1-poster.jpg',
      posterAlt: '#RPD_UT1 Back To School Fall 2025 event poster',
      cover: '/assets/images/events/rpd-ut1-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rdd-6',
      status: 'past',
      title: '#RDD6 — DA\'COMEBACK',
      name: '#RDD6',
      subtitle: 'DA\'COMEBACK',
      page: '',
      startsAt: '2022-07-24T18:00:00+07:00',
      dateLabel: 'Sun, Jul 24 2022',
      monthLabel: 'Jul 2022',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rdd-6-poster.jpg',
      posterAlt: '#RDD6 DA\'COMEBACK event poster',
      cover: '/assets/images/events/rdd-6-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'antivirus',
      status: 'past',
      title: 'Spin-Off — ANTIVIRUS',
      name: 'Spin-Off',
      subtitle: 'ANTIVIRUS',
      page: '',
      startsAt: '2020-08-30T18:00:00+07:00',
      dateLabel: 'Sun, Aug 30 2020',
      monthLabel: 'Aug 2020',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/antivirus-poster.jpg',
      posterAlt: 'Spin-Off ANTIVIRUS event poster',
      cover: '/assets/images/events/antivirus-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rdd-5',
      status: 'past',
      title: '#RDD5 — ONE NEW YEAR. ONE ANNIVERSARY.',
      name: '#RDD5',
      subtitle: 'ONE NEW YEAR. ONE ANNIVERSARY.',
      page: '',
      startsAt: '2020-01-29T18:00:00+07:00',
      dateLabel: 'Wed, Jan 29 2020',
      monthLabel: 'Jan 2020',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rdd-5-poster.jpg',
      posterAlt: '#RDD5 event poster',
      cover: '/assets/images/events/rdd-5-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rdd-4',
      status: 'past',
      title: '#RDD4 — Look Back 2019',
      name: '#RDD4',
      subtitle: 'Look Back 2019',
      page: '',
      startsAt: '2019-12-29T18:00:00+07:00',
      dateLabel: 'Sun, Dec 29 2019',
      monthLabel: 'Dec 2019',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rdd-4-poster.jpg',
      posterAlt: '#RDD4 Look Back 2019 event poster',
      cover: '/assets/images/events/rdd-4-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rdd-3',
      status: 'past',
      title: '#RDD3 — Back To School',
      name: '#RDD3',
      subtitle: 'Back To School',
      page: '',
      startsAt: '2019-08-02T18:00:00+07:00',
      dateLabel: 'Fri, Aug 2 2019',
      monthLabel: 'Aug 2019',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rdd-3-poster.jpg',
      posterAlt: '#RDD3 Back To School event poster',
      cover: '/assets/images/events/rdd-3-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rdd-2',
      status: 'past',
      title: '#RDD2 — Offline Kpop Fan',
      name: '#RDD2',
      subtitle: 'Offline Kpop Fan',
      page: '',
      startsAt: '2019-07-06T18:00:00+07:00',
      dateLabel: 'Sat, Jul 6 2019',
      monthLabel: 'Jul 2019',
      venue: '',
      venueShort: '',
      cta: 'Setlist →',
      poster: '/assets/images/events/rdd-2-poster.jpg',
      posterAlt: '#RDD2 Offline Kpop Fan event poster',
      cover: '/assets/images/events/rdd-2-cover.jpg',
      video: '',
      photos: [],
      rounds: []
    },
    {
      slug: 'rdd-1',
      status: 'past',
      title: '#RDD1 — Random Dance The Debut in Ben Tre, VN',
      name: '#RDD1',
      subtitle: 'Random Dance The Debut in Ben Tre, VN',
      page: '',
      startsAt: '2019-01-30T18:00:00+07:00',
      dateLabel: 'Wed, Jan 30 2019',
      monthLabel: 'Jan 2019',
      venue: 'Bến Tre, Vietnam',
      venueShort: 'Bến Tre, VN',
      cta: 'Setlist →',
      poster: '/assets/images/events/rdd-1-poster.jpg',
      posterAlt: '#RDD1 debut event poster',
      cover: '/assets/images/events/rdd-1-cover.jpg',
      video: '',
      photos: [],
      rounds: []
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
