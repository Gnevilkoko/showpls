import { useState } from "react"
import { useTranslation } from "react-i18next"
import checkGreenIcon from "../../assets/icons/status/check-green.svg"
import checkWhiteIcon from "../../assets/icons/status/check-white.svg"
import closeWhiteIcon from "../../assets/icons/ui/close-icon-white.svg"
import closeIcon from "../../assets/icons/ui/close-icon.svg"
import closeRedIcon from "../../assets/icons/ui/close-icon-red.svg"
import verifiedCheckIcon from "../../assets/icons/status/verified-check.svg"
import cancelCrossIcon from "../../assets/icons/status/cancel-cross.svg"
import type { Message, TaskType } from "../types"
import TaskPrimaryButton from "./TaskPrimaryButton"
import { useNotification } from "../hooks/useNotification"
import Modal from "./Modal"
import AcceptOrderModal from "../../pages/Chat/components/AcceptOrderModal"
import ModalContent from "./ModalContent"
import TaskInfo from "./TaskInfo"

interface NotificationMessageProps {
  message: Message
  userId: number
  onCancelOrder?: () => void
}

const NotificationMessage = ({ message, userId, onCancelOrder }: NotificationMessageProps) => {
  const { t } = useTranslation()
  const notification = useNotification()

  const [isOpenModalAcceptOrder, setIsOpenModalAcceptOrder] = useState(false)
  const [selectedStarRating, setSelectedStarRating] = useState<number>(0)

  const [isOpenModalRejectOrder, setIsOpenModalRejectOrder] = useState(false)

  const [isOpenModalTaskDetails, setIsOpenModalTaskDetails] = useState(false)

  const [customerResponse, setCustomerResponse] = useState<"accept" | "reject" | null>(null)

  //         if (prev.seconds === 0) {
  //           return { minutes: prev.minutes - 1, seconds: 59 }
  //         }

  //         return { minutes: prev.minutes, seconds: prev.seconds - 1 }
  //       })
  //     }, 1000)

  //     return () => clearInterval(interval)
  //   }
  // }, [message.variant, message.receiver_id, userId])

  const handleAcceptJob = () => {
    setCustomerResponse("accept")
    notification.showSuccess("orderAcceptedSuccessfully")
    setIsOpenModalAcceptOrder(false)
  }

  const handleResubmitPhoto = () => {
    setCustomerResponse("reject")
    notification.showSuccess("requestNewPhotoSuccessfully")
    setIsOpenModalRejectOrder(false)
  }

  // const handleOpenCamera = () => {
  //   setIsCameraOpen(true)
  // }

  // const handleCloseCamera = () => {
  //   setIsCameraOpen(false)
  // }

  // const handleCapture = (file: File) => {
  //   setPhotoFile(file)
  //   setIsCameraOpen(false)
  // }

  const isCustomerMessage = String(message.sender_id) !== String(userId)

  return (
    <div className="message__wrapper-notification">
      {/* Upload Notification */}
      {message.variant === "upload" && !isCustomerMessage && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={checkGreenIcon} alt="Check Icon" />

            <span>{t("youUploadedPhoto")}</span>
          </div>
        </div>
      )}

      {message.variant === "newOffer" && !isCustomerMessage && (
        <div className="message-notification-content">
          <span>{t("youMadeNewOffer")}</span>

          <div className="message-notification-actions">
            <TaskPrimaryButton
              color="green"
              onClick={() => setIsOpenModalTaskDetails(true)}
              text={t("tasksPage.viewDetails")}
            />

            <TaskPrimaryButton color="none" onClick={() => {}} icon={closeIcon} text={t("cancelOffer")} />
          </div>
        </div>
      )}

      {message.variant === "newOffer" && isCustomerMessage && (
        <div className="message-notification-content">
          <span>{t("youReceivedNewOffer")}</span>

          <div className="message-notification-actions">
            <TaskPrimaryButton
              color="green"
              onClick={() => setIsOpenModalTaskDetails(true)}
              text={t("tasksPage.viewDetails")}
            />

            <TaskPrimaryButton color="blue" onClick={() => {}} icon={checkWhiteIcon} text={t("acceptAnOffer")} />

            <TaskPrimaryButton color="none" onClick={() => {}} icon={closeIcon} text={t("declineAnOffer")} />
          </div>
        </div>
      )}

      {/* {message.variant === "challenge" && message.receiver_id === userId && (
        <>
          <div className="message-notification-content">
            <span>
              {t("verifChallenge")} {String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>

            <div className="message-notification-actions">
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
      )} */}

      {/* Photo Satisfaction Actions */}
      {message.variant === "upload" && isCustomerMessage && !customerResponse && (
        <div className="message-notification-content">
          <span>{t("submittedFileReview")}</span>

          <div className="message-notification-actions">
            <TaskPrimaryButton
              color="green"
              onClick={() => setIsOpenModalAcceptOrder(true)}
              icon={checkWhiteIcon}
              text={t("acceptJob")}
            />

            <TaskPrimaryButton
              color="blue"
              onClick={() => setIsOpenModalRejectOrder(true)}
              icon={closeWhiteIcon}
              text={t("requestNewPhoto")}
            />
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

      <Modal isOpen={isOpenModalAcceptOrder} onClose={() => setIsOpenModalAcceptOrder(false)}>
        <AcceptOrderModal
          selectedStarRating={selectedStarRating}
          onRatingChange={setSelectedStarRating}
          onConfirm={handleAcceptJob}
          onCancel={() => setIsOpenModalAcceptOrder(false)}
        />
      </Modal>

      <Modal isOpen={isOpenModalRejectOrder} onClose={() => setIsOpenModalRejectOrder(false)}>
        <ModalContent
          icon={cancelCrossIcon}
          title={t("requestNewPhotoQuestion")}
          description={t("sureRequestNewPhoto")}
          confirmText={t("yes")}
          cancelText={t("no")}
          onConfirm={handleResubmitPhoto}
          onCancel={() => setIsOpenModalRejectOrder(false)}
        />
      </Modal>

      <Modal isOpen={isOpenModalTaskDetails} onClose={() => setIsOpenModalTaskDetails(false)}>
        <TaskInfo selectedOrder={message.order as TaskType} />
      </Modal>
    </div>
  )
}

export default NotificationMessage
