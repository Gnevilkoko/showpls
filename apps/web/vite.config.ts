import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "apps/web",
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: "dist/apps/web",
    emptyOutDir: true,
  },
})
