import type { AboutPageContent, ExtraProject, ExtrasPageContent, Photo } from "~/types";

/** Split body text into paragraphs on blank lines. */
export function splitParagraphs(text: string): string[] {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Parse "url" or "url|alt" lines into Photo[]. */
export function parsePhotoLines(text: string, fallbackAlt: string): Photo[] {
  const photos: Photo[] = [];
  for (const line of String(text || "").split(/\n+/)) {
    const raw = line.trim();
    if (!raw) continue;
    const pipe = raw.indexOf("|");
    if (pipe === -1) {
      photos.push({ src: raw, alt: fallbackAlt });
    } else {
      const src = raw.slice(0, pipe).trim();
      const alt = raw.slice(pipe + 1).trim() || fallbackAlt;
      if (src) photos.push({ src, alt });
    }
  }
  return photos;
}

export function formatPhotoLines(photos: Photo[]): string {
  return photos.map((photo) => (photo.alt ? `${photo.src}|${photo.alt}` : photo.src)).join("\n");
}

export function extraPhotos(project: Pick<ExtraProject, "slug" | "title" | "photoCount">): Photo[] {
  return Array.from({ length: Math.max(0, project.photoCount || 0) }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      src: `/assets/images/extras/${project.slug}/${n}.jpg`,
      alt: `${project.title} photo ${i + 1}`,
    };
  });
}

export function sampleAboutContent(): AboutPageContent {
  return {
    title: "About DA'QTAD",
    pronunciation: "/duh-kah-taht/",
    intro:
      "**DA'QTAD** is a K-pop community originally founded in **Bến Tre City, Vietnam, in 2019** by a group of high school friends: (Tâm) Đan, (Trúc) An, (Thúy) Quyên, (Phan) Thông, (Trúc) Anh, and Duke.\n\nWhat started as a shared love for K-pop quickly became something bigger. We wanted to bring K-pop events closer to our local community, especially **K-pop Random Play Dance**, or RPD, where fans gather, recognize songs as they play, jump onto the dance floor, and perform the choreography together.",
    sections: [
      {
        id: "vietnam",
        heading: "Our Beginning in Vietnam",
        body: "Since 2019, DA'QTAD has organized **6 official Random Play Dance events in Bến Tre**, welcoming more than **1,000 participants** in total. We also expanded beyond our main events with special spin-offs, including an RPD held during a university military bootcamp in collaboration with IEF and an online livestreamed RPD during the COVID-19 period.\n\nFor us, DA'QTAD has never been only about dancing. It has always been about creating a place where K-pop fans can meet, connect, have fun, and feel part of a community.",
        mission: "",
        closing: "",
        linkLabel: "",
        linkHref: "",
        videos: "",
        photos: [],
      },
      {
        id: "more",
        heading: "More Than Random Play Dance",
        body: "During our time in Vietnam, we also used our community to create meaningful projects beyond K-pop events: charity work, an international flashmob, and an online radio series.",
        mission: "",
        closing: "",
        linkLabel: "Explore Extras →",
        linkHref: "/extras",
        videos: "",
        photos: [],
      },
      {
        id: "chapter",
        heading: "A New Chapter",
        body: "After COVID-19, the original DA'QTAD members gradually began pursuing different paths around the world. Đan moved to Australia for higher education, An continued her studies in Japan, Quyên and Thông began focusing on their careers, and Duke moved to the United States for university.\n\nBut the DA'QTAD story did not end there.\n\nAfter moving to Salt Lake City, Duke decided to continue the tradition of bringing K-pop fans together and introduced DA'QTAD to the Utah community.\n\nTogether with **Hanni, Phoebe, Vy, and Dinh**, he formed **DA'QTAD USA**, affectionately giving the name a new meaning: **The (da) Cutie (qt) Admins (ad).**",
        mission: "",
        closing: "",
        linkLabel: "",
        linkHref: "",
        videos: "",
        photos: [],
      },
      {
        id: "usa",
        heading: "DA'QTAD USA",
        body: "In **2025 and 2026**, DA'QTAD USA organized **two large-scale K-pop Random Play Dance events in Utah**, welcoming more than **200 attendees combined**.\n\nOur Salt Lake City events have continued the same spirit that started in Bến Tre years ago: an open dance floor, a carefully curated playlist, lots of energy, and a welcoming space where everyone can celebrate K-pop together.\n\nNow, DA'QTAD USA is beginning to expand beyond our own independent events through collaborations, festivals, pop-ups, and conventions. Our participation with **Bopsim** marks our first pop-up event outside of Vietnam and another exciting step in bringing the DA'QTAD experience to new communities.",
        mission: "",
        closing: "",
        linkLabel: "",
        linkHref: "",
        videos: "",
        photos: [],
      },
      {
        id: "means",
        heading: "What DA'QTAD Means to Us",
        body: "DA'QTAD began with six high school friends who simply wanted more K-pop activities in their hometown. Years later, that same idea continues across countries and communities.\n\nWhether we are organizing a Random Play Dance, creating an online project, volunteering, collaborating with other organizations, or simply giving fans a place to dance together, our goal remains the same:",
        mission:
          "Bring people together through K-pop, create unforgettable memories, and keep the Random Play Dance energy alive wherever we go.",
        closing: "From **Bến Tre to Salt Lake City**, this is DA'QTAD.",
        linkLabel: "",
        linkHref: "",
        videos: "",
        photos: [],
      },
    ],
  };
}

export function sampleExtrasContent(): ExtrasPageContent {
  return {
    title: "Extras",
    intro:
      "DA'QTAD has never been only about dancing. These are the community projects we built beyond Random Play Dance: volunteering, creative campaigns, and ways to stay connected when we couldn't gather in person.",
    projects: [
      {
        id: "charity",
        slug: "charity",
        title: "Charity Visit: Chùa Phật Minh",
        eyebrow: "Volunteer · Bến Tre",
        body: "We organized a charity visit to **Chùa Phật Minh (Từ Tâm)** in Bến Tre, where DA'QTAD and local K-pop fans donated gifts to orphaned children.",
        videos: "",
        photoCount: 0,
        photos: [],
      },
      {
        id: "100-project",
        slug: "100-project",
        title: "The 100 Project",
        eyebrow: "International flashmob · COVID-19",
        body: 'During the COVID-19 pandemic, we launched **The 100 Project**, an international online flashmob inspired by the Vietnamese song **"Ghen Cô-Vy."** The project was created to spread positivity and encourage people to protect themselves during the pandemic.\n\nAlthough our original goal was to bring together 100 dancers, the final project connected **30 dancers from 6 different countries**.',
        videos: "",
        photoCount: 0,
        photos: [],
      },
      {
        id: "radionair",
        slug: "radionair",
        title: "radiONair",
        eyebrow: "Online radio series",
        body: "We also created **radiONair**, our online radio series where K-pop fans could join us to talk about music, request their favorite songs, and participate in interactive K-pop games while everyone was staying connected from home.",
        videos: "",
        photoCount: 0,
        photos: [],
      },
    ],
  };
}
