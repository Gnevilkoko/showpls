export type ChatType = {
  chat_id: number
  avatar: string | null
  first_name: string
  last_name: string | null
  last_message: string
  last_update: number
  is_favorite: boolean
  is_active_order: boolean
  order: TaskType | null
  is_read: boolean
  count_unread: number | null
}

export type Message = {
  id: number
  type: "notification" | "message"
  variant?: "upload" | "newTask"
  sender_id: number
  receiver_id: number
  text: string | null
  attachments: string[]
  created_at: number
  is_read: boolean
}

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

export type TgUserType = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export type TransactionType = {
  id: string
  type: "founded" | "escrowHold" | "releasedExecutor" | "refundedCustomer"
  stars?: number
  status: "hold" | "verified"
  isStars: boolean
  date: string
}

export type TaskType = {
  id: string
  title: string
  description: string
  attachments: string[]
  price: number
  position: google.maps.LatLngLiteral
  isUrgent: boolean
  tags: {
    type: "hLeft" | "km"
    count: number
  }[]
  customer_id: number
  performer_id: number | null
}

export type UserFromBackType = {
  telegram_data: TgUserType
  user_id: number
  first_name: string
  last_name: string | null
  language_code: string
  avatar: string | null
  rating: number
  profession: string
  work_status: boolean
  online_status: boolean
  last_online: number
  location: string | null
  balance: number
  balance_hold: number
  chats: ChatsDataType
  transactions: TransactionType[]
  orders: {
    customer: TaskType[]
    performer: TaskType[]
  }
}
