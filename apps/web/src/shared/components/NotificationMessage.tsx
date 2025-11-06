import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import cameraIcon from "../../assets/icons/actions/camera.svg"
import checkGreenIcon from "../../assets/icons/status/check-green.svg"
import closeRedIcon from "../../assets/icons/ui/close-icon-red.svg"
import verifiedCheckIcon from "../../assets/icons/status/verified-check.svg"
import Camera from "./Camera"
import type { Message } from "../types"

interface NotificationMessageProps {
  message: Message
  userId: number
  onCancelOrder?: () => void
}

const NotificationMessage = ({ message, userId, onCancelOrder }: NotificationMessageProps) => {
  const { t } = useTranslation()
  const [customerResponse, setCustomerResponse] = useState<"accept" | "reject" | null>(null)
  const [timeLeft, setTimeLeft] = useState({ minutes: 5, seconds: 0 })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  useEffect(() => {
    if (message.variant === "challenge" && message.receiver_id === userId) {
      setTimeLeft({ minutes: 5, seconds: 0 })

      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.minutes === 0 && prev.seconds === 0) {
            return { minutes: 0, seconds: 0 }
          }

          if (prev.seconds === 0) {
            return { minutes: prev.minutes - 1, seconds: 59 }
          }

          return { minutes: prev.minutes, seconds: prev.seconds - 1 }
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [message.variant, message.receiver_id, userId])

  const handleClickYes = () => {
    setCustomerResponse("accept")
  }

  const handleClickNo = () => {
    setCustomerResponse("reject")
  }

  const handleOpenCamera = () => {
    setIsCameraOpen(true)
  }

  const handleCloseCamera = () => {
    setIsCameraOpen(false)
  }

  const handleCapture = (file: File) => {
    setPhotoFile(file)
    setIsCameraOpen(false)
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

      {message.variant === "challenge" && message.receiver_id === userId && (
        <>
          <div className="message-notification-content">
            <span>
              {t("verifChallenge")} {String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>

            <div className="message-notification-actions challenge">
              <button className="message-notification-action-btn green" onClick={handleOpenCamera} type="button">
                {t("openCamera")}
              </button>

              <button className="message-notification-action-btn blue" onClick={() => {}} type="button">
                {t("openVerifCode")}
              </button>
            </div>

            <span className="message-notification-description">{t("verifChallengeDescription")}</span>
            {photoFile && (
              <span style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "#666" }}>
                Выбран файл: {photoFile.name}
              </span>
            )}
          </div>

          <Camera isOpen={isCameraOpen} onClose={handleCloseCamera} onCapture={handleCapture} />
        </>
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
