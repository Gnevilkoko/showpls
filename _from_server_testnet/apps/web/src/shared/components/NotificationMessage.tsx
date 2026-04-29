import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import checkGreenIcon from "../../assets/icons/status/check-green.svg"
import ImageViewer from "./ImageViewer"
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
import {
  useAcceptResponseMutation,
  useRejectResponseMutation,
  useWithdrawResponseMutation,
} from "../../store/api/responseApi"
import { useRejectSubmissionMutation } from "../../store/api/submissionApi"
import { useAppDispatch } from "../../store"
import { useSubmissionState } from "../hooks/useSubmissionState"
import { requestApi } from "../../store/api/requestApi"
import { submissionApi } from "../../store/api/submissionApi"
import { adaptRequestToTask, type TaskType } from "../types"

interface NotificationMessageProps {
  message: Message
  userId: number
  chatResponses?: {
    id: string
    requestId: string
    status: string
    message?: string | null
    performer?: { id: number } | null
  }[]
  onCancelOrder?: () => void
  /** Вызов при нажатии «Принять» в сообщении о сдаче — чат откроет модалку принятия и выполнит completeRequest */
  onAcceptOrderRequest?: (requestId: string) => void
}

const NotificationMessage = ({
  message,
  userId,
  chatResponses,
  onCancelOrder,
  onAcceptOrderRequest,
}: NotificationMessageProps) => {
  const { t } = useTranslation()
  const notification = useNotification()
  const dispatch = useAppDispatch()

  const [acceptResponse, { isLoading: isAccepting }] = useAcceptResponseMutation()
  const [rejectResponse, { isLoading: isRejecting }] = useRejectResponseMutation()
  const [rejectSubmission, { isLoading: isRejectingSubmission }] = useRejectSubmissionMutation()
  const [withdrawResponse, { isLoading: isWithdrawing }] = useWithdrawResponseMutation()

  const [isOpenModalAcceptOrder, setIsOpenModalAcceptOrder] = useState(false)
  const [selectedStarRating, setSelectedStarRating] = useState<number>(0)

  const [isOpenModalRejectOrder, setIsOpenModalRejectOrder] = useState(false)

  const [isOpenModalTaskDetails, setIsOpenModalTaskDetails] = useState(false)

  const [customerResponse, setCustomerResponse] = useState<"accept" | "reject" | null>(null)
  const [selectedUploadImageIndex, setSelectedUploadImageIndex] = useState<number | null>(null)

  // Локальный флаг: это уведомление уже обработали (accept/decline/withdraw) в этой сессии
  const [isHandledLocally, setIsHandledLocally] = useState(false)

  const isVideoUrl = useCallback((url: string) => /\.(mp4|webm|ogg)$/i.test(url), [])
  // Для заказчика: показать "Вы отклонили предложение" после нажатия "Отклонить"
  const [offerDeclinedByCustomer, setOfferDeclinedByCustomer] = useState(false)

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

  const handleResubmitPhoto = async () => {
    if (!requestIdStr) {
      setIsOpenModalRejectOrder(false)
      return
    }
    try {
      await rejectSubmission({ requestId: requestIdStr }).unwrap()
      setIsOpenModalRejectOrder(false)
      // Оптимистичное обновление кэша — сразу скрываем кнопки без ожидания рефетча
      dispatch(
        requestApi.util.updateQueryData("getRequest", requestIdStr, (draft) => {
          if (draft?.submission) draft.submission = { ...draft.submission, status: "rejected" }
        })
      )
      dispatch(
        submissionApi.util.updateQueryData("getSubmissionByRequest", requestIdStr, (draft) => {
          if (draft) draft.status = "rejected"
        })
      )
    } catch {
      notification.showError("somethingWentWrong")
    }
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
  // Для офферов ориентируемся на направление сообщения, а не на роль чата:
  // receiver принимает/отклоняет, sender может отозвать.
  const isOfferReceiver = String(message.receiver_id) === String(userId)
  const isOfferSender = String(message.sender_id) === String(userId)

  const linkedResponse =
    message.variant === "newOffer" &&
    chatResponses &&
    (message.responseId
      ? chatResponses.find((r) => String(r.id) === String(message.responseId))
          : chatResponses.find(
              (r) =>
                String(r.requestId) === String(message.requestId) &&
                (isOfferReceiver || String(r.performer?.id) === String(userId))
            ))

  // Для исполнителя «Отменить предложение» — только ID pending-отклика из списка чата (надёжный источник)
  const performerPendingResponse =
    message.variant === "newOffer" &&
    chatResponses &&
    isOfferSender &&
    chatResponses.find(
      (r) =>
        String(r.requestId) === String(message.requestId) &&
        String(r.performer?.id) === String(userId) &&
        r.status === "pending"
    )

  // ID отклика: для отзыва — приоритет message.responseId (из уведомления), затем pending из списка; для принять/отклонить — message или linkedResponse
  const effectiveResponseId =
    message.responseId ?? linkedResponse?.id ?? performerPendingResponse?.id
  const responseIdForWithdraw =
    (isOfferSender && (message.responseId ?? performerPendingResponse?.id ?? linkedResponse?.id)) ??
    effectiveResponseId

  const requestIdForDetails = message.requestId || linkedResponse?.requestId || null
  const requestIdStr = requestIdForDetails != null ? String(requestIdForDetails) : ""

  const { requestData, submissionPendingDecision } = useSubmissionState(requestIdStr || null)

  const taskForDetails: TaskType | null = requestData ? adaptRequestToTask(requestData) : null
  const offerMessage = linkedResponse?.message?.trim() || null

  // Скрыть карточку оффера, если статус уже не pending
  if (message.variant === "newOffer" && linkedResponse && linkedResponse.status !== "pending") {
    // Исполнитель: скрыть при любом исходе (accepted/rejected/cancelled)
    if (isOfferSender) return null
    // Заказчик: при rejected показываем "Вы отклонили" ниже; при accepted/cancelled скрываем
    if (linkedResponse.status !== "rejected") return null
  }
  // Исполнитель: не показывать блок «Отменить предложение», если нет id для отзыва (нет ни в сообщении, ни в списке)
  if (message.variant === "newOffer" && isOfferSender && !responseIdForWithdraw) {
    return null
  }
  // Исполнитель отозвал оффер в этой сессии — карточку скрываем
  if (message.variant === "newOffer" && isOfferSender && isHandledLocally) {
    return null
  }
  // Заказчик отклонил оффер — показываем сообщение "Вы отклонили предложение" (и после refetch при status rejected)
  if (
    message.variant === "newOffer" &&
    isOfferReceiver &&
    (offerDeclinedByCustomer || (linkedResponse && linkedResponse.status === "rejected"))
  ) {
    return (
      <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
        <div className="message-notification">
          <img src={closeRedIcon} alt="Declined" />
          <span>{t("youDeclinedOffer")}</span>
        </div>
      </div>
    )
  }

  const handleAcceptOffer = async () => {
    if (!effectiveResponseId) return
    try {
      await acceptResponse({ responseId: String(effectiveResponseId) }).unwrap()
      notification.showSuccess("offerAcceptedSuccessfully")
      setIsHandledLocally(true)
    } catch (e) {
      notification.showError("somethingWentWrong")
    }
  }

  const handleDeclineOffer = async () => {
    if (!effectiveResponseId) return
    try {
      await rejectResponse({ responseId: String(effectiveResponseId) }).unwrap()
      notification.showSuccess("offerDeclinedSuccessfully")
      setOfferDeclinedByCustomer(true)
      setIsHandledLocally(true)
    } catch (e) {
      notification.showError("somethingWentWrong")
    }
  }

  const handleWithdrawOffer = async () => {
    const idToUse = responseIdForWithdraw != null ? String(responseIdForWithdraw) : ""
    if (!idToUse) return
    try {
      await withdrawResponse({ responseId: idToUse }).unwrap()
      notification.showSuccess("offerWithdrawnSuccessfully")
      setIsHandledLocally(true)
    } catch (e: any) {
      const status = e?.status ?? e?.data?.statusCode
      if (status === 404) {
        notification.showError("offerNotFoundOrAlreadyWithdrawn")
      } else {
        notification.showError("somethingWentWrong")
      }
    }
  }

  return (
    <div className="message__wrapper-notification">
      {/* Offer accepted (by customer) — translated, not raw "Response accepted" */}
      {message.variant === "responseAccepted" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={verifiedCheckIcon} alt="Accepted" />
            <span>{t("responseAccepted")}</span>
          </div>
        </div>
      )}

      {/* Offer declined (old "Response declined" message) — translated for performer */}
      {message.variant === "responseDeclined" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={closeRedIcon} alt="Declined" />
            <span>{t("offerDeclinedByCustomer")}</span>
          </div>
        </div>
      )}

      {/* Offer withdrawn — translated */}
      {message.variant === "offerWithdrawn" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={closeIcon} alt="Withdrawn" />
            <span>{t("offerWithdrawn")}</span>
          </div>
        </div>
      )}

      {/* Upload: performer sees "You uploaded", customer sees "Work submitted for review" */}
      {message.variant === "upload" && !isCustomerMessage && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={checkGreenIcon} alt="Check Icon" />
            <span>{t("youUploadedPhoto")}</span>
          </div>
        </div>
      )}
      {message.variant === "upload" && isCustomerMessage && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={checkGreenIcon} alt="Submitted" />
            <span>{t("workSubmittedForReview")}</span>
          </div>
        </div>
      )}

      {/* Сданные файлы (фото/видео) в сообщении «Работа отправлена на проверку» — заказчик и исполнитель видят их прямо в чате */}
      {message.variant === "upload" &&
        message.attachments &&
        message.attachments.length > 0 &&
        (() => {
          const uploadImageUrls = message.attachments.filter((u) => !isVideoUrl(u))
          return (
            <div className="message-notification-attachments">
              {message.attachments.map((url, idx) =>
                isVideoUrl(url) ? (
                  <video
                    key={`${url}-${idx}`}
                    src={url}
                    controls
                    className="message-notification-attachment message-notification-attachment--video"
                  />
                ) : (
                  <button
                    type="button"
                    key={`${url}-${idx}`}
                    className="message-notification-attachment message-notification-attachment--image"
                    onClick={() => setSelectedUploadImageIndex(uploadImageUrls.indexOf(url))}
                  >
                    <img src={url} alt="" />
                  </button>
                )
              )}
            </div>
          )
        })()}

      {/* Task completed — work accepted by customer, funds released */}
      {message.variant === "taskCompleted" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={verifiedCheckIcon} alt="Completed" />
            <span>{t("workAcceptedByCustomer")}</span>
          </div>
        </div>
      )}

      {/* Task cancelled — escrow refunded/rejected */}
      {message.variant === "taskCancelled" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={closeRedIcon} alt="Cancelled" />
            <span>{message.text || t("taskAlreadyClosed")}</span>
          </div>
        </div>
      )}

      {/* Submission rejected — customer sees "You rejected", performer sees "Customer rejected" */}
      {message.variant === "submissionRejected" && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={closeRedIcon} alt="Rejected" />
            <span>
              {message.sender_id === userId ? t("submissionRejectedByYou") : t("submissionRejectedByCustomer")}
            </span>
          </div>
        </div>
      )}

      {message.variant === "newOffer" && isOfferSender && (
        <div className="message-notification-content">
          <span>{t("youMadeNewOffer")}</span>

          <div className="message-notification-actions">
            <TaskPrimaryButton
              color="green"
              onClick={() => setIsOpenModalTaskDetails(true)}
              text={t("tasksPage.viewDetails")}
            />

            <TaskPrimaryButton
              color="none"
              onClick={handleWithdrawOffer}
              icon={closeIcon}
              text={t("cancelOffer")}
              disabled={isWithdrawing || isAccepting || isRejecting || !responseIdForWithdraw}
            />
          </div>
        </div>
      )}

      {message.variant === "newOffer" && isOfferReceiver && (
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
              disabled={isAccepting || isRejecting || !effectiveResponseId}
            />

            <TaskPrimaryButton
              color="none"
              onClick={handleDeclineOffer}
              icon={closeIcon}
              text={t("declineAnOffer")}
              disabled={isAccepting || isRejecting || !effectiveResponseId}
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

      {/* Кнопки «Принять»/«Запросить новое фото» — только пока решение не принято. После принятия/отклонения не показываем (в т.ч. после перезагрузки). */}
      {message.variant === "upload" && isCustomerMessage && !customerResponse && submissionPendingDecision && (
          <div className="message-notification-content">
            <span>{t("submittedFileReview")}</span>

            <div className="message-notification-actions">
              <TaskPrimaryButton
                color="green"
                onClick={() =>
                  onAcceptOrderRequest ? onAcceptOrderRequest(requestIdStr) : setIsOpenModalAcceptOrder(true)
                }
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

      {message.variant === "upload" &&
        message.attachments &&
        selectedUploadImageIndex !== null &&
        (() => {
          const imageUrls = message.attachments.filter((url) => !isVideoUrl(url))
          const index = selectedUploadImageIndex
          if (index < 0 || index >= imageUrls.length) return null
          return (
            <ImageViewer
              images={imageUrls}
              currentImageIndex={index}
              onClose={() => setSelectedUploadImageIndex(null)}
            />
          )
        })()}

      {/* Customer Response */}
      {customerResponse && (
        <div className={`message__wrapper ${message.sender_id === userId ? "right" : "left"}`}>
          <div className="message-notification">
            <img src={customerResponse === "accept" ? verifiedCheckIcon : closeRedIcon} alt="Response Icon" />
            <span>{customerResponse === "accept" ? t("verifiedPhoto") : t("rejectedPhoto")}</span>
          </div>
        </div>
      )}

      {/* Generic notification (arbitration, admin joined, etc.) */}
      {!message.variant && message.text && (
        <div className="message__wrapper center">
          <div className="message-notification message-notification--system">
            <span>{message.text}</span>
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

      {!onAcceptOrderRequest && (
        <Modal isOpen={isOpenModalAcceptOrder} onClose={() => setIsOpenModalAcceptOrder(false)}>
          <AcceptOrderModal
            selectedStarRating={selectedStarRating}
            onRatingChange={setSelectedStarRating}
            onConfirm={handleAcceptJob}
            onCancel={() => setIsOpenModalAcceptOrder(false)}
          />
        </Modal>
      )}

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
