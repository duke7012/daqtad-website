import { safeHref, youtubeIds } from "~/lib/urls";
import type { EventItem, Social } from "~/types";

export type HeroButtonKind = "instagram" | "facebook" | "youtube" | "drive";

export interface HeroButton {
  kind: HeroButtonKind;
  href: string;
  label: string;
}

function youtubeHref(event: EventItem): string {
  const url = safeHref(event.youtubeUrl);
  if (url) return url;
  const ids = youtubeIds(event.video);
  return ids[0] ? `https://www.youtube.com/watch?v=${ids[0]}` : "";
}

export function eventHeroButtons(event: EventItem, social: Social): HeroButton[] {
  const buttons: HeroButton[] = [];

  if (event.showInstagram !== false) {
    const href = safeHref(event.instagramUrl) || safeHref(social.instagram);
    if (href) buttons.push({ kind: "instagram", href, label: "Instagram" });
  }

  if (event.showFacebook !== false) {
    const href = safeHref(event.facebookUrl) || safeHref(social.facebook);
    if (href) buttons.push({ kind: "facebook", href, label: "Photo album" });
  }

  if (event.showYoutube) {
    const href = youtubeHref(event);
    if (href) buttons.push({ kind: "youtube", href, label: "YouTube" });
  }

  if (event.showDrive !== false) {
    const href = safeHref(event.drive);
    if (href) buttons.push({ kind: "drive", href, label: "Photo drive" });
  }

  return buttons;
}
