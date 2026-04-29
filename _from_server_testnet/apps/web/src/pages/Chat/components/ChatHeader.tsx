import arrowLeftIcon from "../../../assets/icons/ui/arrow-left.svg"
import cameraWhiteIcon from "../../../assets/icons/actions/camera-white.svg"
import starOutlineIcon from "../../../assets/icons/status/star-outline.svg"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"
import userIcon from "../../../assets/icons/navigation/user.svg"
import { useTranslation } from "react-i18next"
import type { ChatType } from "../../../shared/types"
import { formatTimeFromEpochMs } from "../../../shared/format"

type ChatHeaderProps = {
  chat: ChatType
  isFavorite: boolean
  onBack: () => void
  onToggleFavorite: () => void
  /** Подзаголовок (например, режим ответа от поддержки в админке) */
  subtitle?: string
  /** Показать кнопку «Сдать работу» (исполнитель, заказ в работе) */
  canShowSubmitWork?: boolean
  /** Клик по кнопке «Сдать работу» — открывает модалку сдачи */
  onSubmitWork?: () => void
}

const ChatHeader = ({
  chat,
  isFavorite,
  onBack,
  onToggleFavorite,
  subtitle,
  canShowSubmitWork,
  onSubmitWork,
}: ChatHeaderProps) => {
  const { t } = useTranslation()
  const lastOnline = formatTimeFromEpochMs(chat.last_update)

  return (
    <div className="chat__header">
      <div className="chats-header__title">
        <button
          type="button"
          className="chat-header__back-arrow"
          onClick={onBack}
          aria-label={t("chatBackToList")}
          title={t("chatBackToList")}
        >
          <img src={arrowLeftIcon} alt="" aria-hidden />
        </button>

        <img src={chat.avatar ? chat.avatar : userIcon} alt="User Avatar" className="chat__avatar" />

        <div className="chat-header__user-info">
          <span className="chat-header__name-user">
            {chat.first_name} {chat.last_name && chat.last_name}
          </span>
          {subtitle ? <span className="chat-header__subtitle">{subtitle}</span> : null}
          <span className="chat-header__online-status">{lastOnline}</span>
        </div>
      </div>

      <div className="chats__actions">
        {canShowSubmitWork && onSubmitWork && (
          <button
            type="button"
            className="chat-header__submit-work-btn"
            onClick={onSubmitWork}
            title={t("submitWork")}
          >
            <img src={cameraWhiteIcon} alt="" aria-hidden />
            <span>{t("submitWork")}</span>
          </button>
        )}

        <button className="chats__favorites-btn" onClick={onToggleFavorite} title={t("favorites")}>
          <img src={isFavorite ? starFilledIcon : starOutlineIcon} alt="Favorite Icon" />
        </button>
      </div>
    </div>
  )
}

export default ChatHeader
