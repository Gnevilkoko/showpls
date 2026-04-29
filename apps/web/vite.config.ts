/// <reference types="vitest" />
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
      // разрешаем все хосты (для ngrok и т.д.)
      allowedHosts: true,
      proxy: {
        "/api": {
          target: process.env.VITE_API_URL || "http://127.0.0.1:8080",
          changeOrigin: true,
          secure: false,
        },
        "/chat/ws": {
          target: process.env.VITE_API_URL || "http://127.0.0.1:8080",
          ws: true,
          changeOrigin: true,
          secure: false,
        },
      },
    }),
    fs: {
      allow: [".."],
    },
  },
  // `vite preview` на сервере за Traefik/nginx — Host ≠ localhost; иначе Vite блокирует запрос
  preview: {
    port: 3000,
    host: true,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: "dist/apps/web",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reportsDirectory: "../../coverage/apps/web",
    },
  },
})
