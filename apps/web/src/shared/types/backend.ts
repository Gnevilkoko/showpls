// Типы данных из бекенда (соответствуют backend_technical_specification.md)
// Эти типы представляют сырые данные из API и могут отличаться от типов фронтенда

export type RequestStatus =
  | "draft"
  | "published"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "arbitration"

export type ResponseStatus = "pending" | "accepted" | "rejected" | "cancelled"

export type DealStatus = "accepted" | "in_progress" | "completed" | "cancelled"

export type EscrowStatus = "locked" | "released" | "rejected" | null

export type SubmissionStatus = "pending" | "submitted" | "accepted" | "rejected"

export type MessageType = "message" | "notification"

export type MessageVariant = "upload" | "newTask" | "permissionToCancel" | "taskCompleted" | "taskCancelled"

export interface UserInfo {
  id: string
  firstName: string
  lastName: string | null
  avatar: string | null
}

export interface FileAttachment {
  id: string
  url: string
  hash: string
}

export interface RequestBackend {
  id: string
  title: string
  description: string
  price: number
  status: RequestStatus
  attachments: FileAttachment[]
  latitude: number
  longitude: number
  address: string | null // Опциональный адрес для отображения (есть в бекенде)
  customer: UserInfo
  performer: UserInfo | null
  createdAt: string
  updatedAt: string
  acceptedAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  expiresAt: string | null
  deadlineAt: string | null
  isUrgent: boolean
  metadata?: Record<string, unknown>
  responses?: ResponseBackend[] // Опционально - только для заказчика или исполнителя этого отклика
  submission?: SubmissionBackend | null // Опционально - последний Submission (самый свежий по createdAt)
}

export interface ResponseBackend {
  id: string
  requestId: string
  performer: UserInfo
  status: ResponseStatus
  message: string | null
  createdAt: string
}

export interface DealBackend {
  id: string
  requestId: string
  responseId: string
  customer: UserInfo
  performer: UserInfo
  status: DealStatus
  escrowStatus: EscrowStatus
  arbitrationApproved: boolean
  createdAt: string
  updatedAt: string
}

// ChatBackend для GET /chat/:id (полная версия)
export interface ChatBackend {
  id: string
  user1: UserInfo
  user2: UserInfo
  admin: UserInfo | null
  lastMessage: string | null
  lastUpdate: string | null
  isFavorite: boolean // Для текущего пользователя
  isRead: boolean // Для текущего пользователя
  countUnread: number // Для текущего пользователя
  isActiveOrder: boolean
  isArbitration: boolean
}

// ChatListItem для GET /chat/list (упрощенная версия)
export interface ChatListItem {
  chatId: string
  avatar: string | null
  firstName: string
  lastName: string | null
  lastMessage: string | null
  lastUpdate: string | null
  isFavorite: boolean
  isRead: boolean
  countUnread: number
  isActiveOrder: boolean
  isArbitration: boolean
}

export interface MessageBackend {
  id: string
  // chatId не возвращается в API ответах, но можно получить из контекста
  type: MessageType
  variant?: MessageVariant
  sender: UserInfo
  receiver: UserInfo
  text: string | null
  attachments: string[]
  createdAt: string
  isRead: boolean
}

export interface SubmissionBackend {
  id: string
  requestId: string
  performer: UserInfo
  status: SubmissionStatus
  attachments: FileAttachment[]
  createdAt: string
  serverTs: string | null
  proofMeta: {
    clientGeo?: { latitude: number; longitude: number } | null
  }
}

// Тип для упрощенного отображения задач на карте
export interface RequestMapItem {
  id: string
  title: string
  price: number
  status: string
  lng: number // longitude (не latitude!)
  lat: number // latitude (не longitude!)
}

// Тип для исполнителей рядом с задачей
export interface PerformerNearby {
  id: string
  firstName: string
  lastName: string | null
  avatar: string | null
  rating: number // Всегда 0 на данный момент (TODO на бекенде)
  latitude: number
  longitude: number
  distance: number // Расстояние в км
}

// Тип ответа для completeRequest
export interface CompleteRequestResponse {
  id: string
  status: RequestStatus
  completedAt: string | null
  deal: {
    id: string
    status: DealStatus
    escrowStatus: EscrowStatus
  }
}
