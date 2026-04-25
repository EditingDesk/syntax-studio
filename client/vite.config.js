import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: process.env.PORT || 4173,
    allowedHosts: [
      "syntax-studio-frontend.up.railway.app"
    ]
  }
});