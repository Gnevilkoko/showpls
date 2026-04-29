import type { ChatType } from "../../../shared/types"
import userIcon from "../../../assets/icons/navigation/user.svg"
import checkReadIcon from "../../../assets/icons/status/check-read.svg"
import starOutlineIcon from "../../../assets/icons/status/star-outline.svg"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"
import pinPushIcon from "../../../assets/icons/status/pin-push.svg"
import { formatTimeFromEpochMs } from "../../../shared/format"
import { useNavigate } from "react-router-dom"
import { memo, MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { useToggleFavoriteMutation } from "../../../store/api/chatApi"
import { isSupportAgentChatItem } from "../../../shared/utils/supportChat"

interface ChatPrevItemProps {
  chat: ChatType
}

const BACKEND_LAST_MESSAGE_KEYS: Record<string, string> = {
  "New offer on your request": "newOfferOnYourRequest",
  "Offer withdrawn": "offerWithdrawn",
}

const ChatItem = memo(({ chat }: ChatPrevItemProps) => {
  const isSupportChat = isSupportAgentChatItem(chat)
  const { t } = useTranslation()
  const time = formatTimeFromEpochMs(chat.last_update)
  const navigate = useNavigate()
  const [toggleFavorite, { isLoading: isToggling }] = useToggleFavoriteMutation()
  const lastMessageDisplay =
    chat.last_message && BACKEND_LAST_MESSAGE_KEYS[chat.last_message]
      ? t(BACKEND_LAST_MESSAGE_KEYS[chat.last_message])
      : chat.last_message

  const handleClickChat = () => {
    if (String(chat.chat_id) === "support") {
      navigate("/chat/support")
    } else {
      navigate(`/chat/${chat.chat_id}`)
    }
  }

  const handleToggleFavorite = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (isSupportChat) return
    if (isToggling) return
    toggleFavorite({
      chatId: String(chat.chat_id),
      body: { isFavorite: !chat.is_favorite },
    })
  }

  return (
    <div
      className={`chats__prev-chat ${isSupportChat ? "agent" : ""} ${chat.count_unread ? "unread" : ""} ${
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

            {isSupportChat ? (
              <span className="prev-chat__pin-wrap" title={t("pinnedSupportChat")} aria-label={t("pinnedSupportChat")}>
                <img src={pinPushIcon} alt="" className="prev-chat__pin-icon" />
              </span>
            ) : null}

            <button className="prev-chat__favorite-btn" onClick={handleToggleFavorite} disabled={isToggling || isSupportChat}>
              <img src={chat.is_favorite ? starFilledIcon : starOutlineIcon} alt="Favorite Icon" />
            </button>
          </div>
        </div>

        <div className="prev-chat__content">
          <span className="prev-chat__message">{lastMessageDisplay}</span>

          {chat.count_unread ? (
            <div className="chats__count blue">
              <span>{chat.count_unread}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
})

export default ChatItem
