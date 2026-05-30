import { defineConfig } from "vite";

export default defineConfig({
  root: "ClientApp",
  base: "/app/",
  publicDir: false,
  build: {
    outDir: "../wwwroot/app",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: "ClientApp/src/main.ts",
      output: {
        entryFileNames: "main.js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    },
    chunkSizeWarningLimit: 500
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    proxy: {
      "/api": "http://localhost:5152",
      "/styles": "http://localhost:5152"
    }
  }
});
