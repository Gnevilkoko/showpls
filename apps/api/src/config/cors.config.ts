import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface"

// Нормализуем origin: браузер присылает без trailing slash, в env может быть со слэшем
function normalizeOrigin(url: string): string {
  return url.replace(/\/+$/, "")
}

// Единый список доверенных источников (AllowList)
const allowedOriginsList = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8080",
  "https://testnet.showpls.com",
  "http://testnet.showpls.com",
  "https://web.telegram.org", // Telegram Web (в т.ч. Mini App в браузере на iPhone)
  process.env.DOMAIN,
  process.env.NGROK_URL,
]
  .filter((url): url is string => !!url)
  .map(normalizeOrigin)

const allowedOrigins = [...new Set(allowedOriginsList)]

// Проверка origin: точное совпадение или поддомен trycloudflare.com (туннели).
// Отсутствие origin — запрос same-origin (браузер не шлёт Origin), разрешаем.
// В development разрешаем любой origin (туннели, прокси, разный Origin в Docker).
// На iOS в WebView иногда приходит origin === "null" (строка) — разрешаем для Mini App.
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true
  if (process.env.NODE_ENV === "development") return true
  // WKWebView на iOS в ряде сценариев шлёт буквально "null"
  if (origin === "null") return true
  const normalized = normalizeOrigin(origin)
  if (allowedOrigins.includes(normalized)) return true
  try {
    const u = new URL(normalized)
    if (u.hostname.endsWith(".trycloudflare.com")) return true
  } catch {
    // ignore
  }
  return false
}

export default function (): CorsOptions {
  return {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, origin ?? true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization", "User-Agent", "X-Requested-With"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }
}

// Экспортируем для WebSocket (isOriginAllowed уже экспортирована выше)
export { allowedOrigins }
