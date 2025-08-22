// vite.config.js
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "backend/dist"   // 👈 ensures dist goes into backend
  }
})