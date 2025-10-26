import cameraIcon from "../../../assets/icons/actions/camera.svg"
import checkGreenIcon from "../../../assets/icons/status/check-green.svg"
import checkReadIcon from "../../../assets/icons/status/check-read.svg"
import checkReadWhiteIcon from "../../../assets/icons/status/check-read-white.svg"
import closeRedIcon from "../../../assets/icons/ui/close-icon-red.svg"
import verifiedCheckIcon from "../../../assets/icons/status/verified-check.svg"
import type { Message } from "../../../shared/types"
import { formatTimeFromEpochMs } from "../../../shared/format"
import { useTranslation } from "react-i18next"
import { memo, useState } from "react"

type MessageItemProps = {
  message: Message
}

const MessageItem = memo(({ message }: MessageItemProps) => {
  const { t } = useTranslation()
  // здесь нужно брать свой айдишник из user
  const userId = 100

  const [customerResponse, setCustomerResponse] = useState<"accept" | "reject" | null>(null)

  const time = formatTimeFromEpochMs(message.created_at)

  const handleClickYes = () => {
    setCustomerResponse("accept")
  }

  const handleClickNo = () => {
    setCustomerResponse("reject")
  }

  if (message.type === "notification") {
    return (
      <div className="message__wrapper-notification">
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={message.variant === "upload" ? checkGreenIcon : cameraIcon} alt="Camera Icon" />

            {message.variant === "upload" && <span>{t("executorUploadPhoto")}</span>}
            {message.variant === "newTask" && <span>{t("customerNewTask")}</span>}
          </div>
        </div>

        {message.variant === "upload" && message.sender_id !== userId && !customerResponse && (
          <div className="message-notification-content">
            <span>{t("satisfiedPhoto")}</span>

            <div className="message-notification-actions">
              <button className="message-notification-action-btn blue" onClick={handleClickNo}>
                {t("no")}
              </button>

              <button className="message-notification-action-btn green" onClick={handleClickYes}>
                {t("yes")}
              </button>
            </div>
          </div>
        )}

        {customerResponse && (
          <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
            <div className="message-notification">
              <img src={customerResponse === "accept" ? verifiedCheckIcon : closeRedIcon} alt="Check Icon" />

              <span>{customerResponse === "accept" ? t("verifiedPhoto") : t("rejectedPhoto")}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
      <div className={`message ${message.sender_id === userId ? "green" : ""} ${!message.text ? "image" : ""}`}>
        {message.attachments && message.attachments.map((url) => <img key={url} src={url} alt="Attachments Image" />)}

        {message.text ? (
          <div className="message__content">
            <span>{message.text}</span>
            <div className="message__info">
              <span>{time}</span>
              {message.is_read && <img src={checkReadIcon} alt="Check Read Icon" />}
            </div>
          </div>
        ) : (
          <div className="message__info-blur">
            <span>{time}</span>
            {message.is_read && <img src={checkReadWhiteIcon} alt="Check Read Icon" />}
          </div>
        )}
      </div>
    </div>
  )
})

export default MessageItem
