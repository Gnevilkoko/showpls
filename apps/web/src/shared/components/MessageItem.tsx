import { memo } from "react"
import type { Message } from "../types"
import NotificationMessage from "./NotificationMessage"
import RegularMessage from "./RegularMessage"

type ChatResponseLite = {
  id: string
  requestId: string
  status: string
  message?: string | null
  performer?: any
}

interface MessageItemProps {
  message: Message
  userId: number
  chatResponses?: ChatResponseLite[]
  onCancelOrder?: () => void
}

const MessageItem = memo(({ message, userId, chatResponses, onCancelOrder }: MessageItemProps) => {
  if (message.type === "notification") {
    return <NotificationMessage message={message} userId={userId} chatResponses={chatResponses} onCancelOrder={onCancelOrder} />
  }

  return <RegularMessage message={message} userId={userId} />
})

MessageItem.displayName = "MessageItem"

export default MessageItem
