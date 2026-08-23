import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/public-layout.tsx", [
    index("routes/home.tsx"),
    route("events", "routes/events.tsx"),
    route("events/popup", "routes/events-popup.tsx"),
    route("events/:slug", "routes/events-slug.tsx"),
    route("gallery", "routes/gallery.tsx"),
    route("setlists", "routes/setlists.tsx"),
    route("about", "routes/about.tsx"),
    route("resources/instagram-photo", "routes/resources.instagram-photo.tsx"),
    route("*", "routes/not-found.tsx"),
  ]),
  route("admin", "routes/admin.tsx"),
] satisfies RouteConfig;
