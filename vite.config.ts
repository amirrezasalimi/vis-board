import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  css: {},
  plugins: [
    tailwindcss(),
    svgr({
      include: "**/*.svg",
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
});
