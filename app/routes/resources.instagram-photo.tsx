import { fetchInstagramImage } from "~/lib/instagram.server";
import { safeHref } from "~/lib/urls";
import type { Route } from "./+types/resources.instagram-photo";

export async function loader({ request }: Route.LoaderArgs) {
  const post = safeHref(new URL(request.url).searchParams.get("post"));
  if (!post) {
    throw new Response("Missing post URL", { status: 400 });
  }

  const image = await fetchInstagramImage(post);
  if (!image) {
    throw new Response("Could not load Instagram photo", { status: 404 });
  }

  return image;
}
