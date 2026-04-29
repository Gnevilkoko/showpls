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
  chatId?: string
  chatResponses?: ChatResponseLite[]
  onCancelOrder?: () => void
  onAcceptOrderRequest?: (requestId: string) => void
}

const MessageItem = memo(
  ({ message, userId, chatId, chatResponses, onCancelOrder, onAcceptOrderRequest }: MessageItemProps) => {
    if (message.type === "notification") {
      return (
        <NotificationMessage
          message={message}
          userId={userId}
          chatResponses={chatResponses}
          onCancelOrder={onCancelOrder}
          onAcceptOrderRequest={onAcceptOrderRequest}
        />
      )
    }

    return <RegularMessage message={message} userId={userId} chatId={chatId} />
  }
)

MessageItem.displayName = "MessageItem"

export default MessageItem
