import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  /** Expone al cliente variables de entorno con estos prefijos (base del API = …/api). */
  envPrefix: ["VITE_", "FRONTEND_", "REACT_APP_"],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
    testTimeout: 15_000,
  },
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
