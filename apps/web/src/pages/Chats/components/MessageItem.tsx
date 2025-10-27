import { memo } from "react"
import type { Message } from "../../../shared/types"
import NotificationMessage from "./NotificationMessage"
import RegularMessage from "./RegularMessage"

interface MessageItemProps {
  message: Message
  userId: number
  onCancelOrder?: () => void
}

const MessageItem = memo(({ message, userId, onCancelOrder }: MessageItemProps) => {
  if (message.type === "notification") {
    return <NotificationMessage message={message} userId={userId} onCancelOrder={onCancelOrder} />
  }

  return <RegularMessage message={message} userId={userId} />
})

MessageItem.displayName = "MessageItem"

export default MessageItem
