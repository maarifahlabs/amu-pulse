import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";



export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/amu-pulse/" : "/"),
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // Provide safe empty fallback for packages accessing process.env
    "process.env": {},
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
