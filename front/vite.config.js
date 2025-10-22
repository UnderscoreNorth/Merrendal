import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

const config = defineConfig(({ mode }) => ({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $img: mode === "production" ? "./static/" : "../",
    },
  },
}));

export default config;
