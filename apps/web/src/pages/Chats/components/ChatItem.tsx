import type { ChatType } from "../../../shared/types"
import userIcon from "../../../assets/icons/navigation/user.svg"
import checkReadIcon from "../../../assets/icons/status/check-read.svg"
import starOutlineIcon from "../../../assets/icons/status/star-outline.svg"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"
import { formatTimeFromEpochMs } from "../../../shared/format"
import { useNavigate } from "react-router-dom"
import { memo } from "react"

interface ChatPrevItemProps {
  chat: ChatType
}

const ChatItem = memo(({ chat }: ChatPrevItemProps) => {
  const time = formatTimeFromEpochMs(chat.last_update)
  const navigate = useNavigate()

  const handleClickChat = () => {
    navigate(`/chat/${chat.chat_id}`)
  }

  return (
    <div
      className={`chats__prev-chat ${chat.chat_id === 0 ? "agent" : ""} ${chat.count_unread ? "unread" : ""} ${
        chat.is_active_order ? "active-order" : ""
      }`}
      onClick={handleClickChat}
    >
      <img src={chat.avatar ? chat.avatar : userIcon} alt="User Avatar" className="prev-chat__avatar" loading="lazy" />

      <div className="prev-chat__wrapper">
        <div className="prev-chat__header">
          <span className="prev-chat__name-user">
            {chat.first_name} {chat.last_name ? chat.last_name : ""}
          </span>

          <div className="prev-chat__info">
            {chat.is_read && <img src={checkReadIcon} alt="Check Read Icon" />}

            <span>{time}</span>

            <button className="prev-chat__favorite-btn">
              <img src={chat.is_favorite ? starFilledIcon : starOutlineIcon} alt="Favorite Icon" />
            </button>
          </div>
        </div>

        <div className="prev-chat__content">
          <span className="prev-chat__message">{chat.last_message}</span>

          {chat.count_unread && (
            <div className="chats__count blue">
              <span>{chat.count_unread}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default ChatItem
