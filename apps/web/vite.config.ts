import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const isDev = process.env.NODE_ENV === "development"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "apps/web",
  // Указываем директорию для поиска .env файлов (относительно корня проекта)
  envDir: "../..",
  server: {
    port: 3000,
    host: true,
    // Добавляем только в режиме разработки
    ...(isDev && {
      strictPort: false,
      allowedHosts: ["postesophageal-isochronal-lashawna.ngrok-free.dev"],
    }),
  },
  build: {
    outDir: "dist/apps/web",
    emptyOutDir: true,
  },
})
