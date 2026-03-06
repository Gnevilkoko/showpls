import { useState } from "react"
import { useTranslation } from "react-i18next"
import checkGreenIcon from "../../assets/icons/status/check-green.svg"
import checkWhiteIcon from "../../assets/icons/status/check-white.svg"
import closeWhiteIcon from "../../assets/icons/ui/close-icon-white.svg"
import closeIcon from "../../assets/icons/ui/close-icon.svg"
import closeRedIcon from "../../assets/icons/ui/close-icon-red.svg"
import verifiedCheckIcon from "../../assets/icons/status/verified-check.svg"
import cancelCrossIcon from "../../assets/icons/status/cancel-cross.svg"
import type { Message } from "../types"
import TaskPrimaryButton from "./TaskPrimaryButton"
import { useNotification } from "../hooks/useNotification"
import Modal from "./Modal"
import AcceptOrderModal from "../../pages/Chat/components/AcceptOrderModal"
import ModalContent from "./ModalContent"
import TaskInfo from "./TaskInfo"
import { useAcceptResponseMutation, useRejectResponseMutation } from "../../store/api/responseApi"
import { useGetRequestQuery } from "../../store/api/requestApi"
import { adaptRequestToTask, type TaskType } from "../types"

interface NotificationMessageProps {
  message: Message
  userId: number
  chatResponses?: { id: string; requestId: string; status: string; message?: string | null }[]
  onCancelOrder?: () => void
}

const NotificationMessage = ({ message, userId, chatResponses, onCancelOrder }: NotificationMessageProps) => {
  const { t } = useTranslation()
  const notification = useNotification()

  const [acceptResponse, { isLoading: isAccepting }] = useAcceptResponseMutation()
  const [rejectResponse, { isLoading: isRejecting }] = useRejectResponseMutation()

  const [isOpenModalAcceptOrder, setIsOpenModalAcceptOrder] = useState(false)
  const [selectedStarRating, setSelectedStarRating] = useState<number>(0)

  const [isOpenModalRejectOrder, setIsOpenModalRejectOrder] = useState(false)

  const [isOpenModalTaskDetails, setIsOpenModalTaskDetails] = useState(false)

  const [customerResponse, setCustomerResponse] = useState<"accept" | "reject" | null>(null)

  // Локальный флаг: это уведомление уже обработали (accept/decline) в этой сессии
  const [isHandledLocally, setIsHandledLocally] = useState(false)

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

  const linkedResponse =
    message.variant === "newOffer" &&
    message.responseId &&
    chatResponses &&
    chatResponses.find((r) => String(r.id) === String(message.responseId))

  const requestIdForDetails = message.requestId || linkedResponse?.requestId || null
  const { data: requestData } = useGetRequestQuery(requestIdForDetails || "", {
    skip: !requestIdForDetails,
  })

  const taskForDetails: TaskType | null = requestData ? adaptRequestToTask(requestData) : null
  const offerMessage = linkedResponse?.message?.trim() || null

  if (message.variant === "newOffer" && (isHandledLocally || (linkedResponse && linkedResponse.status !== "pending"))) {
    return null
  }

  const handleAcceptOffer = async () => {
    if (!message.responseId) return
    try {
      await acceptResponse({ responseId: String(message.responseId) }).unwrap()
      notification.showSuccess("offerAcceptedSuccessfully")
      setIsHandledLocally(true)
    } catch (e) {
      notification.showError("somethingWentWrong")
    }
  }

  const handleDeclineOffer = async () => {
    if (!message.responseId) return
    try {
      await rejectResponse({ responseId: String(message.responseId) }).unwrap()
      notification.showSuccess("offerDeclinedSuccessfully")
      setIsHandledLocally(true)
    } catch (e) {
      notification.showError("somethingWentWrong")
    }
  }

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

            <TaskPrimaryButton
              color="blue"
              onClick={handleAcceptOffer}
              icon={checkWhiteIcon}
              text={t("acceptAnOffer")}
              disabled={isAccepting || isRejecting || !message.responseId}
            />

            <TaskPrimaryButton
              color="none"
              onClick={handleDeclineOffer}
              icon={closeIcon}
              text={t("declineAnOffer")}
              disabled={isAccepting || isRejecting || !message.responseId}
            />
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
        {taskForDetails && (
          <div className="notification-task-details">
            <TaskInfo selectedOrder={taskForDetails} />
            {offerMessage && (
              <div className="notification-task-details__offer-message">
                <span className="notification-task-details__offer-message-title">{t("responseTask")}</span>
                <span className="notification-task-details__offer-message-text">{offerMessage}</span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default NotificationMessage
