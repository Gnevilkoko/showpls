export type UploadedImageType = {
  file?: File // Опционально: для новых файлов есть file, для существующих (с сервера) - нет
  url: string
}

export type TelegramAuthDataType = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export type TelegramWebAppUserType = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

export type UserType = {
  accessToken: string
  userData: UserDataType
}

export type UserDataType = {
  id: string
  role: string
  tgId: string
  username: string | null
  firstName: string
  lastName: string | null
  avatar: string | null
  city: string | null
  about: string | null
  languageCode: string
  banned: boolean
  lastSeenAt: string
  createdAt: string
}

// ⚠️ ВНИМАНИЕ: Эти типы устарели и используются только для совместимости со старым кодом
// НОВЫЙ КОД должен использовать типы из backend.ts напрямую!
// Адаптеры для преобразования находятся в adapters.ts

// Реэкспорт типов бекенда для удобства импорта
// Можно импортировать как: import type { RequestBackend } from "../../shared/types"
// или напрямую: import type { RequestBackend } from "../../shared/types/backend"
export * from "./backend.ts"

// Реэкспорт адаптеров
export * from "./adapters.ts"
import type { Message, ChatType } from "./adapters.ts"

// Устаревшие типы (будут удалены после миграции на типы бекенда)
// ... перенесены в adapters.ts

export type DataMessages = {
  chat_id: number
  messages: Message[]
  has_more: boolean
}

export type ChatsDataType = {
  count_unread: number
  count_unread_favorite: number
  chat_list: ChatType[]
}

export type TransactionType = {
  id: string
  type: "founded" | "escrowHold" | "releasedExecutor" | "refundedCustomer"
  stars?: number
  status: "hold" | "verified"
  isStars: boolean
  date: string
}

// ⚠️ УСТАРЕЛО: Используйте RequestBackend из backend.ts напрямую!
// TaskType оставлен только для совместимости со старым кодом и перенесен в adapters.ts

// API Error types
export type APIErrorCode =
  | "business-error"
  | "validation-error"
  | "access-denied"
  | "unauthorized"
  | "access-token-expired"
  | "internal-server-error"
  | "rate-limited"

export type APIErrorResponse = {
  statusCode: number
  errorCode: APIErrorCode
  message?: string | object
}

export type APIError = {
  data?: APIErrorResponse
  status?: number
}

export type PerformerType = {
  id: number | string
  firstName: string
  lastName: string | null
  avatar: string | null
  position: { lat: number; lng: number }
  lastSeenAt: Date
  rating: number
}

// ============================================================================
// РЕЭКСПОРТ ТИПОВ БЕКЕНДА (основной источник правды)
// ============================================================================
// ✅ ИСПОЛЬЗУЙТЕ ТИПЫ БЕКЕНДА НАПРЯМУЮ в новом коде!
// Можно импортировать как: import type { RequestBackend } from "../../shared/types"
// или напрямую: import type { RequestBackend } from "../../shared/types/backend"
export * from "./backend.ts"

// ============================================================================
// РЕЭКСПОРТ АДАПТЕРОВ (для преобразования в типы фронтенда)
// ============================================================================
// Используйте адаптеры только там, где нужны преобразования для UI
// (например, для Google Maps: latitude/longitude → position)
export * from "./adapters.ts"

// export type UserFromBackType = {
//   telegram_data: TgUserType
//   user_id: number
//   first_name: string
//   last_name: string | null
//   language_code: string
//   avatar: string | null
//   rating: number
//   profession: string
//   work_status: boolean
//   online_status: boolean
//   last_online: number
//   location: string | null
//   balance: number
//   balance_hold: number
//   chats: ChatsDataType
//   transactions: TransactionType[]
//   orders: {
//     customer: TaskType[]
//     performer: TaskType[]
//   }
// }
