import { reactRouter } from "@react-router/dev/vite";
import netlifyReactRouter from "@netlify/vite-plugin-react-router";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    {
      name: "world-map-alias",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === "/world-map" || req.url === "/world-map/") {
            req.url = "/world-map.html";
          }
          next();
        });
      },
    },
    reactRouter(),
    tsconfigPaths(),
    netlifyReactRouter(),
  ],
});
