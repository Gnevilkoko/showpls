// Адаптеры для преобразования типов бекенда в типы фронтенда
// Используются только там, где нужны специфичные для UI преобразования

import type { RequestBackend, ChatListItem, MessageBackend, RequestMapItem, RequestStatus } from "./backend"

/**
 * Преобразует RequestBackend в TaskType для использования в UI
 * Используется только там, где нужны специфичные для фронтенда поля (position, tags, mode)
 */
export type TaskType = Omit<RequestBackend, "latitude" | "longitude" | "attachments" | "customer" | "performer"> & {
  // Преобразование координат для Google Maps
  position: google.maps.LatLngLiteral
  // Преобразование attachments в простые строки для UI
  attachments: string[]
  // ID вместо объектов для совместимости со старым кодом
  customer_id: number
  performer_id: number | null
  // Дополнительные поля для UI
  mode: "base" | "pro" // Вычисляется из metadata.verifProof
  tags: {
    type: "hLeft" | "km"
    count: number
  }[]
  // Флаг: арбитраж согласен закрыть задачу (из DealBackend, если есть)
  arbitrationApproved: boolean
}

/**
 * Адаптер для преобразования RequestBackend в TaskType
 */
export function adaptRequestToTask(request: RequestBackend): TaskType {
  // Вычисление tags из expiresAt/deadlineAt
  const tags: TaskType["tags"] = []
  if (request.isUrgent && request.deadlineAt) {
    const deadline = new Date(request.deadlineAt)
    const now = new Date()
    const hoursLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (hoursLeft > 0) {
      tags.push({ type: "hLeft", count: hoursLeft })
    }
  } else if (request.expiresAt) {
    const expires = new Date(request.expiresAt)
    const now = new Date()
    const hoursLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60))
    if (hoursLeft > 0) {
      tags.push({ type: "hLeft", count: hoursLeft })
    }
  }

  // Вычисление mode из metadata
  const verifProof = request.metadata?.verifProof as "base" | "pro" | undefined
  const mode: "base" | "pro" = verifProof === "pro" ? "pro" : "base"

  return {
    ...request,
    position: { lat: request.latitude, lng: request.longitude },
    attachments: request.attachments.map((att) => att.url),
    customer_id: parseInt(request.customer.id),
    performer_id: request.performer ? parseInt(request.performer.id) : null,
    mode, // Вычисляется из metadata.verifProof
    tags,
    arbitrationApproved: false, // По умолчанию false, так как это поле из DealBackend
  }
}

/**
 * Преобразует ChatBackend или ChatListItem в ChatType для UI
 * Используется только там, где нужна совместимость со старым кодом
 */
export type ChatType = {
  chat_id: number
  avatar: string | null
  first_name: string
  last_name: string | null
  last_message: string
  last_update: number // timestamp в миллисекундах
  is_favorite: boolean
  is_active_order: boolean
  orders: ChatOrderType[] | null
  is_read: boolean
  count_unread: number | null
}

export type ChatOrderType = {
  order: TaskType
  escrowStatus: "locked" | "released" | "rejected" | null
}

/**
 * Адаптер для преобразования ChatListItem в ChatType
 */
export function adaptChatListItemToChat(chat: ChatListItem, orders?: ChatOrderType[]): ChatType {
  return {
    chat_id: parseInt(chat.chatId),
    avatar: chat.avatar,
    first_name: chat.firstName,
    last_name: chat.lastName,
    last_message: chat.lastMessage || "",
    last_update: chat.lastUpdate ? new Date(chat.lastUpdate).getTime() : 0,
    is_favorite: chat.isFavorite,
    is_active_order: chat.isActiveOrder,
    orders: orders || null,
    is_read: chat.isRead,
    count_unread: chat.countUnread,
  }
}

/**
 * Преобразует MessageBackend в Message для UI
 * Используется только там, где нужна совместимость со старым кодом
 */
export type Message = {
  id: number
  type: "notification" | "message"
  variant?: "upload" | "permissionToCancel" | "newOffer"
  sender_id: number
  receiver_id: number
  text: string | null
  attachments: string[]
  created_at: number // timestamp в миллисекундах
  is_read: boolean
  order?: TaskType
}

/**
 * Адаптер для преобразования MessageBackend в Message
 */
export function adaptMessageBackendToMessage(message: MessageBackend, order?: TaskType): Message {
  // Преобразование variant: бекенд использует "newTask", фронтенд использует "newOffer"
  // Также игнорируем "taskCompleted" и "taskCancelled" которые не поддерживаются в старом типе Message
  let variant: Message["variant"] = undefined
  if (message.variant === "newTask") {
    variant = "newOffer"
  } else if (message.variant === "upload" || message.variant === "permissionToCancel") {
    variant = message.variant
  }
  // "taskCompleted" и "taskCancelled" игнорируются, так как не поддерживаются в старом типе Message

  return {
    id: parseInt(message.id),
    type: message.type,
    variant,
    sender_id: parseInt(message.sender.id),
    receiver_id: parseInt(message.receiver.id),
    text: message.text,
    attachments: message.attachments,
    created_at: new Date(message.createdAt).getTime(),
    is_read: message.isRead,
    order,
  }
}

/**
 * Преобразует RequestMapItem в TaskType для отображения на карте
 * RequestMapItem - упрощенная версия задачи для карты (только id, title, price, status, lng, lat)
 *
 * ВАЖНО: RequestMapItem содержит только минимальные данные, поэтому недостающие поля заполняются дефолтными значениями
 */
export function adaptRequestMapItemToTask(mapItem: RequestMapItem): TaskType {
  // Вычисляем tags (пустой массив, так как в RequestMapItem нет expiresAt/deadlineAt)
  const tags: TaskType["tags"] = []

  // Вычисляем mode (по умолчанию "base", так как в RequestMapItem нет metadata)
  const mode: "base" | "pro" = "base"

  // Текущая дата для дефолтных значений временных полей
  const now = new Date().toISOString()

  return {
    // Основные поля из RequestMapItem
    id: mapItem.id,
    title: mapItem.title,
    price: mapItem.price,
    status: mapItem.status as RequestStatus,

    // Поля с дефолтными значениями (отсутствуют в RequestMapItem)
    description: "",
    attachments: [],
    address: null,
    createdAt: now,
    updatedAt: now,
    acceptedAt: null,
    completedAt: null,
    cancelledAt: null,
    expiresAt: null,
    deadlineAt: null,
    isUrgent: false,
    metadata: undefined,
    responses: undefined,
    submission: undefined,

    // Преобразованные поля для UI
    position: { lat: mapItem.lat, lng: mapItem.lng },
    customer_id: 0, // RequestMapItem не содержит customer_id
    performer_id: null, // RequestMapItem не содержит performer_id
    mode,
    tags,
    arbitrationApproved: false, // RequestMapItem не содержит arbitrationApproved
  }
}
