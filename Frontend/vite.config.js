import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // During local dev, forward /api straight to the SocioSphere backend
      // so you don't need CORS setup while testing. Change the target to your
      // deployed backend when needed.
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
