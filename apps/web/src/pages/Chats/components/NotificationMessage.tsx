import { useState } from "react"
import { useTranslation } from "react-i18next"
import cameraIcon from "../../../assets/icons/actions/camera.svg"
import checkGreenIcon from "../../../assets/icons/status/check-green.svg"
import closeRedIcon from "../../../assets/icons/ui/close-icon-red.svg"
import verifiedCheckIcon from "../../../assets/icons/status/verified-check.svg"
import type { Message } from "../../../shared/types"

interface NotificationMessageProps {
  message: Message
  userId: number
  onCancelOrder?: () => void
}

const NotificationMessage = ({ message, userId, onCancelOrder }: NotificationMessageProps) => {
  const { t } = useTranslation()
  const [customerResponse, setCustomerResponse] = useState<"accept" | "reject" | null>(null)

  const handleClickYes = () => {
    setCustomerResponse("accept")
  }

  const handleClickNo = () => {
    setCustomerResponse("reject")
  }

  const isCustomerMessage = message.sender_id !== userId

  return (
    <div className="message__wrapper-notification">
      {/* Upload Notification */}
      {message.variant === "upload" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={checkGreenIcon} alt="Check Icon" />
            <span>{t("executorUploadPhoto")}</span>
          </div>
        </div>
      )}

      {/* New Task Notification */}
      {message.variant === "newTask" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={cameraIcon} alt="Camera Icon" />
            <span>{t("customerNewTask")}</span>
          </div>
        </div>
      )}

      {/* Photo Satisfaction Actions */}
      {message.variant === "upload" && isCustomerMessage && !customerResponse && (
        <div className="message-notification-content">
          <span>{t("satisfiedPhoto")}</span>
          <div className="message-notification-actions">
            <button className="message-notification-action-btn blue" onClick={handleClickNo} type="button">
              {t("no")}
            </button>
            <button className="message-notification-action-btn green" onClick={handleClickYes} type="button">
              {t("yes")}
            </button>
          </div>
        </div>
      )}

      {/* Customer Response */}
      {customerResponse && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={customerResponse === "accept" ? verifiedCheckIcon : closeRedIcon} alt="Response Icon" />
            <span>{customerResponse === "accept" ? t("verifiedPhoto") : t("rejectedPhoto")}</span>
          </div>
        </div>
      )}

      {/* Permission to Cancel */}
      {message.variant === "permissionToCancel" && (
        <div className="message-notification-content">
          <span>{t("permissionToCancel")}</span>
          <div className="message-notification-actions">
            <button className="message-notification-action-btn blue" onClick={onCancelOrder} type="button">
              {t("cancelOrder")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationMessage
