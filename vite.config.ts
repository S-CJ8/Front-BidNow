import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "FRONTEND_"],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/backend-proxy": {
        target: "https://back-bidnow.onrender.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/backend-proxy/, ""),
      },
    },
  },
});
