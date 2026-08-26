import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  test: {
    environment: "jsdom",
    setupFiles: ['./vitest.setup.js'],
  },

  // Vite options tailored for Tauri development
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: true, // Listen on all local interfaces
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 1420,
    },
    watch: {
      // Tell Vite to ignore watching src-tauri
      ignored: ["**/src-tauri/**"],
    },
  },
});
