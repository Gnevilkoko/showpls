import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface"

// Единый список доверенных источников (AllowList)
const allowedOrigins = [
  "http://localhost:3000",      // Локальный фронт
  "http://localhost:8080",      // Локальный бэк/тесты
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
  process.env.FRONTEND_URL,     // Боевой фронт
  process.env.NGROK_URL,        // Ngrok для разработки
].filter((url): url is string => !!url)  // Убираем пустые (undefined), если переменных нет

export default function (): CorsOptions {
  return {
    origin: allowedOrigins,
    allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization", "User-Agent", "X-Requested-With"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }
}

// Экспортируем список origins для использования в WebSocket
export { allowedOrigins }
