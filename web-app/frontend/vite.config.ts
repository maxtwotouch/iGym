import { defineConfig } from "vite"
import autoprefixer from "autoprefixer"
import tailwindcss from "tailwindcss"
import { reactRouter } from "@react-router/dev/vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [
    /**
     * IMPORTANT: Set `ssr: true` so that the build includes
     * both client (build/client) and server (build/server) bundles.
     */
    reactRouter(),
    tsconfigPaths(),
  ],
});