import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: false
  }
});
