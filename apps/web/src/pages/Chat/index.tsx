import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { APIError, Message } from "../../shared/types"
import ChatHeader from "./components/ChatHeader"
import EscrowStatus from "./components/EscrowStatus"
import TaskActions from "./components/TaskActions"
import AcceptOrderModal from "./components/AcceptOrderModal"

import cancelCrossIcon from "../../assets/icons/status/cancel-cross.svg"
import checkWhiteIcon from "../../assets/icons/status/check-white.svg"
import arrowLeftIcon from "../../assets/icons/ui/arrow-left.svg"
import MessageItem from "../../shared/components/MessageItem"
import MessageInput from "../../shared/components/MessageInput"
import Modal from "../../shared/components/Modal"
import ModalContent from "../../shared/components/ModalContent"
import TaskInfo from "../../shared/components/TaskInfo"
import TaskHeader from "../../shared/components/TaskHeader"
import TaskSwitcher from "./components/TaskSwitcher"
import TaskPrimaryButton from "../../shared/components/TaskPrimaryButton"
import ImageViewer from "../../shared/components/ImageViewer"
import type { UploadedImageType } from "../../shared/types"
import { useNotification } from "../../shared/hooks/useNotification"
import { NotificationHandler } from "../../shared/utils/notificationHandler"
import { isRequestOwnedByUser } from "../../shared/utils/requestOwnership"
import CreateArbitrationModal from "./components/CreateArbitrationModal"
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  useGetChatQuery,
  useSendMessageMutation,
  useToggleFavoriteMutation,
} from "../../store/api/chatApi"
import { useCompleteRequestMutation, useCancelRequestMutation } from "../../store/api/requestApi"
import { useUploadFileMutation } from "../../store/api/uploadApi"
import { useCreateSubmissionMutation } from "../../store/api/submissionApi"
import { useSubmissionState } from "../../shared/hooks/useSubmissionState"
import { useCreateArbitrationMutation } from "../../store/api/arbitrationApi"
import UploadWorkModal from "./components/UploadWorkModal"
import {
  adaptMessageBackendToMessage,
  adaptRequestToTask,
  type ChatType,
  type ChatOrderType,
  type TaskType,
} from "../../shared/types/adapters"
import { useAppDispatch, useAppSelector, type RootState } from "../../store"
import { chatApi } from "../../store/api/chatApi"
import { requestApi } from "../../store/api/requestApi"
import { submissionApi } from "../../store/api/submissionApi"

const CANCELLABLE_REQUEST_STATUSES = new Set(["draft", "published", "accepted", "in_progress", "arbitration"])

/** Копирует файл в память. Обходит проблему iOS/Telegram, когда File из системного "Сделать фото" не читается при отправке. */
async function materializeFileForUpload(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  const type = file.type || (file.name && /\.(jpg|jpeg|heic|heif|png|webp|gif)$/i.test(file.name) ? "image/jpeg" : "application/octet-stream")
  return new File([buffer], file.name || `upload-${Date.now()}`, { type })
}

const Chat = () => {
  const { id } = useParams<{ id: string }>()
  const isSupportRoute = id === "support"
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()

  const handleBack = useCallback(() => {
    navigate("/chats")
  }, [navigate])

  // Берем реальный ID пользователя из Redux
  const userId = useAppSelector((state: RootState) => state.user.userData?.id)
  const partnerTyping = useAppSelector((state: RootState) => (id && id !== "support" ? Boolean(state.chatTyping[id]) : false))
  const userRole = useAppSelector((state: RootState) => state.user.userData?.role)
  const isAdmin = userRole === "admin"

  const { t } = useTranslation()
  const notification = useNotification()

  const [value, setValue] = useState("")

  const [isOpenModalAcceptOrder, setIsOpenModalAcceptOrder] = useState(false)
  const [isOpenModalRejectOrder, setIsOpenModalRejectOrder] = useState(false)
  const [isOpenModalCompleteOrder, setIsOpenModalCompleteOrder] = useState(false)

  const [isOpenTask, setIsOpenTask] = useState<boolean>(false)
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0)
  const [selectedStarRating, setSelectedStarRating] = useState<number>(0)
  const [feedback, setFeedback] = useState("")
  const [images, setImages] = useState<UploadedImageType[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const [isOpenModalArbitration, setIsOpenModalArbitration] = useState<boolean>(false)
  const [isOpenModalCancelTask, setIsOpenModalCancelTask] = useState(false)

  // Получаем данные чата
  const {
    data: chatData,
    isLoading,
    isError,
    refetch: refetchChat,
  } = useGetChatQuery({ id: id!, params: {} }, { skip: !id || isSupportRoute })

  /** Переход из админки: отвечаем как поддержка, даже если аккаунт админа — участник чата (свой тикет). */
  const openAsSupportOperator =
    (location.state as { openAsSupportOperator?: boolean } | null)?.openAsSupportOperator === true ||
    searchParams.get("as_support") === "1"

  const isSupportChat = useMemo(() => {
    if (!chatData) return false
    const u1Name = `${chatData.chat.user1?.firstName ?? ""} ${chatData.chat.user1?.lastName ?? ""}`.trim().toLowerCase()
    const u2Name = `${chatData.chat.user2?.firstName ?? ""} ${chatData.chat.user2?.lastName ?? ""}`.trim().toLowerCase()
    return u1Name === "showpls agent" || u2Name === "showpls agent"
  }, [chatData])

  const isAdminViewingOthersSupport = useMemo(() => {
    if (!isAdmin || !isSupportChat || !chatData) return false
    const myId = String(userId)
    return myId !== String(chatData.chat.user1.id) && myId !== String(chatData.chat.user2.id)
  }, [isAdmin, isSupportChat, chatData, userId])

  const isAdminOperatingSupport = useMemo(
    () => Boolean(isAdmin && isSupportChat && (isAdminViewingOthersSupport || openAsSupportOperator)),
    [isAdmin, isSupportChat, isAdminViewingOthersSupport, openAsSupportOperator]
  )

  const [isUploadingLocalFiles, setIsUploadingLocalFiles] = useState(false)

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [toggleFavorite, { isLoading: isTogglingFavorite }] = useToggleFavoriteMutation()
  const [uploadFile] = useUploadFileMutation()
  const [createSubmission, { isLoading: isUploadingSubmission }] = useCreateSubmissionMutation()
  const [createArbitration, { isLoading: isCreatingArbitration }] = useCreateArbitrationMutation()
  const [completeRequest, { isLoading: isCompleting }] = useCompleteRequestMutation()
  const [cancelRequest, { isLoading: isCancelling }] = useCancelRequestMutation()
  useEffect(() => {
    if (!isSupportRoute) return
    dispatch(chatApi.endpoints.createSupportChat.initiate())
      .unwrap()
      .then((result: any) => {
        const chatId = String(result?.chatId ?? result?.id ?? result?.chat?.id ?? "")
        if (chatId) {
          navigate(`/chat/${chatId}`, { replace: true })
        } else {
          navigate("/chats", { replace: true })
        }
      })
      .catch(() => {
        navigate("/chats", { replace: true })
      })
  }, [isSupportRoute]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const bb = window.Telegram?.WebApp?.BackButton
    if (!bb?.show || !bb.onClick) return
    bb.show()
    bb.onClick(handleBack)
    return () => {
      if (typeof bb.offClick === "function") {
        bb.offClick(handleBack)
      }
      bb.hide()
    }
  }, [handleBack])

  const getCancelTaskUnavailableReason = useCallback(
    (status?: string) => {
      if (!status) return t("taskAlreadyClosed")
      if (status === "completed") return t("cancelTaskUnavailableCompleted")
      if (status === "cancelled") return t("cancelTaskUnavailableCancelled")

      const statusKeyMap: Record<string, string> = {
        draft: "taskStatusDraft",
        published: "taskStatusPublished",
        accepted: "taskStatusAccepted",
        in_progress: "taskStatusInProgress",
        completed: "taskStatusCompleted",
        cancelled: "taskStatusCancelled",
        arbitration: "taskStatusArbitration",
      }
      const statusLabel = t(statusKeyMap[status] || "taskStatus")
      return t("cancelTaskUnavailableForStatus", { status: statusLabel })
    },
    [t]
  )

  const handleCompleteRequest = async () => {
    if (!currentRequestId) return
    try {
      await completeRequest({
        id: currentRequestId,
        body: {
          rating: selectedStarRating > 0 ? selectedStarRating : undefined,
          feedback: feedback.trim() ? feedback.trim() : undefined,
        },
      }).unwrap()
      setIsOpenModalAcceptOrder(false)
      setSelectedStarRating(0)
      setFeedback("")
      notification.showSuccess("orderAcceptedSuccessfully")
    } catch (error) {
      if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(error)) {
        NotificationHandler.showError(error as APIError, t("errors.unknownError"))
      }
    }
  }

  const handleCancelRequest = async () => {
    if (!currentRequestId) return
    try {
      const freshRequest = await dispatch(
        requestApi.endpoints.getRequest.initiate(currentRequestId, { forceRefetch: true })
      ).unwrap()
      if (!isAdmin && !isRequestOwnedByUser(freshRequest, userId)) {
        NotificationHandler.handleError(null, t("accessDenied"))
        return
      }
      const freshStatus = freshRequest?.status
      const canCancelByFreshStatus = typeof freshStatus === "string" && CANCELLABLE_REQUEST_STATUSES.has(freshStatus)
      if (!canCancelByFreshStatus) {
        NotificationHandler.handleError(null, getCancelTaskUnavailableReason(freshStatus))
        return
      }

      await cancelRequest(currentRequestId).unwrap()
      setIsOpenModalRejectOrder(false)
      setIsOpenModalCancelTask(false)
      notification.showSuccess("orderCancelledSuccessfully")
    } catch (error) {
      const backendMessage = (error as APIError)?.data?.message
      if (typeof backendMessage === "string" && backendMessage.includes("Request cannot be cancelled in current status")) {
        NotificationHandler.handleError(null, getCancelTaskUnavailableReason(requestData?.status))
        return
      }
      if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(error)) {
        NotificationHandler.showError(error as APIError, t("errors.unknownError"))
      }
    }
  }

  const handleUploadSubmission = async (
    imagesToUpload: UploadedImageType[],
    geo: { latitude: number; longitude: number } | null
  ) => {
    if (!currentRequestId) return
    if (imagesToUpload.length === 0) {
      notification.showWarning("invalidFields")
      return
    }

    try {
      const uploadPromises = imagesToUpload.map(async (img) => {
        if ((img.url.startsWith("blob:") || img.url.startsWith("http://localhost")) && img.file) {
          let fileToUpload: File
          try {
            fileToUpload = await materializeFileForUpload(img.file)
          } catch {
            throw new Error(t("errors.invalidAttachmentReaddOrUseSnapshot"))
          }
          const result = await uploadFile(fileToUpload).unwrap()
          return result.url
        }
        return img.url
      })
      const attachmentUrls = await Promise.all(uploadPromises)

      const newSubmission = await createSubmission({
        requestId: currentRequestId,
        attachments: attachmentUrls,
        proofMeta: geo ? { clientGeo: geo } : undefined,
      }).unwrap()

      dispatch(
        requestApi.util.updateQueryData("getRequest", currentRequestId, (draft) => {
          if (draft) draft.submission = newSubmission
        })
      )
      dispatch(
        submissionApi.util.updateQueryData("getSubmissionByRequest", currentRequestId, () => newSubmission)
      )

      notification.showSuccess("workSubmittedForReview")
      setIsOpenModalCompleteOrder(false)
      refetchChat()
    } catch (error) {
      if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(error)) {
        NotificationHandler.showError(error as APIError, t("errors.failedToSubmitWork"))
      }
    }
  }

  const handleSendMessage = async () => {
    if (!value.trim() && images.length === 0) return
    if (isUploadingLocalFiles || isSending) return

    const isLocalUrl = (url: string) =>
      url.startsWith("blob:") || url.startsWith("http://localhost")

    for (const img of images) {
      if (isLocalUrl(img.url) && !img.file) {
        NotificationHandler.handleError(null, t("errors.invalidAttachmentReaddOrUseSnapshot"))
        return
      }
    }

    try {
      setIsUploadingLocalFiles(true)
      const attachmentUrls: string[] = []
      for (const img of images) {
        if (isLocalUrl(img.url) && img.file) {
          let fileToUpload: File
          try {
            fileToUpload = await materializeFileForUpload(img.file)
          } catch {
            NotificationHandler.handleError(null, t("errors.invalidAttachmentReaddOrUseSnapshot"))
            return
          }
          const result = await uploadFile(fileToUpload).unwrap()
          attachmentUrls.push(result.url)
        } else if (!isLocalUrl(img.url)) {
          attachmentUrls.push(img.url)
        }
      }

      await sendMessage({
        chatId: id!,
        body: {
          text: value.trim() || undefined,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          type: "message",
          ...(isAdminOperatingSupport ? { asSupport: true } : {}),
        },
      }).unwrap()

      setValue("")
      setImages([])
    } catch (error) {
      if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(error)) {
        NotificationHandler.showError(error as APIError, t("errors.unknownError"))
      }
    } finally {
      setIsUploadingLocalFiles(false)
    }
  }

  const handleCreateArbitration = async (reason: string) => {
    if (!currentRequestId || !reason.trim()) return

    try {
      const result = await createArbitration({
        requestId: currentRequestId,
        reason: reason.trim(),
      }).unwrap()

      setIsOpenModalArbitration(false)
      navigate(`/chat/${result.chatId}`)
    } catch (error) {
      if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(error)) {
        NotificationHandler.showError(error as APIError, t("errors.unknownError"))
      }
    }
  }

  const handleToggleFavorite = useCallback(() => {
    if (!id || !chatData || isTogglingFavorite) return
    toggleFavorite({
      chatId: id,
      body: { isFavorite: !chatData.chat.isFavorite },
    })
  }, [id, chatData, isTogglingFavorite, toggleFavorite])

  // Собираем ID задач, связанных с этим чатом (завершённые не показываем в списке сверху)
  const requestIds = useMemo(() => {
    if (!chatData) return []

    const isCompleted = (req: { status?: string } | null) => req?.status === "completed"

    const dealRequestIds =
      chatData.deals
        ?.filter((d: any) => !isCompleted(d.request))
        .map((d: any) => d.requestId || d.request?.id)
        .filter(Boolean) || []

    const responseRequestIds =
      chatData.responses
        ?.filter((r: any) => !isCompleted(r.request))
        .map((r: any) => r.requestId || r.request?.id)
        .filter(Boolean) || []

    const ids = [...dealRequestIds, ...responseRequestIds].map((id) => String(id))
    return [...new Set(ids)]
  }, [chatData])

  const currentRequestId = requestIds[selectedOrderIndex] ?? ""

  const {
    requestData,
    submissionByRequest,
    effectiveSubmission,
    submissionPendingDecision,
  } = useSubmissionState(currentRequestId || null)

  // Ищем связанную с задачей сделку для Escrow и arbitrationApproved
  const selectedDeal = useMemo(() => {
    if (!chatData || !currentRequestId) return null
    return (
      chatData.deals.find(
        (d: any) => String(d.requestId || d.request?.id) === String(currentRequestId)
      ) || null
    )
  }, [chatData, currentRequestId])

  // Адаптируем запрос к TaskType (с deal для arbitrationApproved)
  const selectedOrderTask: TaskType | null = useMemo(() => {
    if (!requestData) return null
    return adaptRequestToTask(requestData, selectedDeal)
  }, [requestData, selectedDeal])

  // Всегда показывать свежий submission по задаче (фото сдачи), чтобы заказчик видел последнюю сданную работу
  const selectedOrderTaskWithFreshSubmission: TaskType | null = useMemo(() => {
    if (!selectedOrderTask) return null
    if (submissionByRequest)
      return { ...selectedOrderTask, submission: submissionByRequest }
    return selectedOrderTask
  }, [selectedOrderTask, submissionByRequest])

  const selectedChatOrderType: ChatOrderType | null = useMemo(() => {
    if (!selectedOrderTask) return null
    return {
      order: selectedOrderTask,
      escrowStatus: selectedDeal?.escrowStatus || null,
    }
  }, [selectedOrderTask, selectedDeal])

  // Исполнитель может сдать, когда сделка в работе и по текущей сдаче уже принято решение (принято/отклонено) или сдачи ещё не было
  const performerCanSubmit =
    selectedDeal &&
    (selectedDeal.status === "accepted" || selectedDeal.status === "in_progress") &&
    !submissionPendingDecision

  // Арбитраж доступен только для задач в статусе accepted или in_progress
  const canCreateArbitration =
    requestData &&
    (requestData.status === "accepted" || requestData.status === "in_progress")

  const canCancelTask = !!requestData?.status && CANCELLABLE_REQUEST_STATUSES.has(requestData.status)
  const isCurrentUserCustomer = useMemo(() => isRequestOwnedByUser(requestData, userId), [requestData, userId])

  const cancelTaskUnavailableReason = useMemo(() => {
    if (!requestData?.status || canCancelTask) return undefined
    return getCancelTaskUnavailableReason(requestData.status)
  }, [requestData?.status, canCancelTask, getCancelTaskUnavailableReason])

  const adaptedMessages: Message[] = useMemo(() => {
    if (!chatData?.messages) return []
    return chatData.messages.map((m) => adaptMessageBackendToMessage(m, undefined))
  }, [chatData?.messages])

  const effectiveUserId = useMemo(() => {
    if (!isAdmin || !isSupportChat || !chatData) return userId
    const u1Name = `${chatData.chat.user1?.firstName ?? ""} ${chatData.chat.user1?.lastName ?? ""}`.trim().toLowerCase()
    const agentUser = u1Name === "showpls agent" ? chatData.chat.user1 : chatData.chat.user2
    if (isAdminOperatingSupport) return String(agentUser.id)
    const myId = String(userId)
    const u1Id = String(chatData.chat.user1.id)
    const u2Id = String(chatData.chat.user2.id)
    const isParticipant = myId === u1Id || myId === u2Id
    if (isParticipant) return userId
    return String(agentUser.id)
  }, [isAdmin, isSupportChat, chatData, userId, isAdminOperatingSupport])

  const adaptedChatHeader: ChatType | null = useMemo(() => {
    if (!chatData) return null
    const u1Id = String(chatData.chat.user1.id)
    const u2Id = String(chatData.chat.user2.id)
    const myId = String(userId)
    const isParticipant = myId === u1Id || myId === u2Id

    let otherUser = u1Id === myId ? chatData.chat.user2 : chatData.chat.user1

    if (isAdminOperatingSupport) {
      const u1Name = `${chatData.chat.user1?.firstName ?? ""} ${chatData.chat.user1?.lastName ?? ""}`.trim().toLowerCase()
      otherUser = u1Name === "showpls agent" ? chatData.chat.user2 : chatData.chat.user1
    }
    const rawLast = chatData.chat.lastMessage || ""
    const last_message =
      rawLast === "New offer on your request"
        ? t("newOfferOnYourRequest")
        : rawLast === "Offer withdrawn"
          ? t("offerWithdrawn")
          : rawLast
    return {
      chat_id: Number(chatData.chat.id),
      avatar: otherUser.avatar,
      first_name: otherUser.firstName,
      last_name: otherUser.lastName,
      last_message,
      last_update: chatData.chat.lastUpdate ? new Date(chatData.chat.lastUpdate).getTime() : 0,
      is_favorite: chatData.chat.isFavorite,
      is_active_order: chatData.chat.isActiveOrder,
      is_read: chatData.chat.isRead,
      count_unread: chatData.chat.countUnread,
      orders: selectedChatOrderType ? [selectedChatOrderType] : null,
      active_request_title: selectedOrderTask?.title || null,
      active_request_price: selectedOrderTask?.price || null,
      deals_count: chatData.deals?.length || 0,
    }
  }, [chatData, userId, selectedChatOrderType, selectedOrderTask, t, isAdminOperatingSupport])

  const isBlockedByPendingResponse = useMemo(() => {
    if (!chatData || !userId) return false
    const myResponses = chatData.responses?.filter((r: any) => r.performer?.id === userId) || []
    if (myResponses.length === 0) return false
    const myDeals = chatData.deals?.filter((d: any) => d.performer?.id === userId || d.customer?.id === userId) || []
    if (myDeals.length > 0) return false

    return myResponses.some((r: any) => r.status === "pending")
  }, [chatData, userId])

  const isChatClosedNoDeals = useMemo(() => {
    if (!chatData || isSupportChat) return false
    const hasDeals = (chatData.deals?.length ?? 0) > 0
    if (hasDeals) return false
    const hasPendingResponse = chatData.responses?.some((r: any) => r.status === "pending") ?? false
    return !hasPendingResponse
  }, [chatData, isSupportChat])

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  /** Открыть модалку принятия заказа по requestId из сообщения (переключаем на этот заказ и показываем модалку) */
  const handleAcceptOrderFromMessage = useCallback(
    (requestId: string) => {
      const idx = requestIds.findIndex((id) => String(id) === String(requestId))
      if (idx >= 0) setSelectedOrderIndex(idx)
      setIsOpenModalAcceptOrder(true)
    },
    [requestIds]
  )

  const handleChangeSelectedOrderIndex = useCallback(
    (newIndex: number) => {
      if (requestIds.length === 0) return

      if (newIndex > requestIds.length - 1) {
        setSelectedOrderIndex(0)
      } else if (newIndex < 0) {
        setSelectedOrderIndex(requestIds.length - 1)
      } else {
        setSelectedOrderIndex(newIndex)
      }
    },
    [requestIds.length]
  )

  useEffect(() => {
    if (isSupportRoute) return
    if (isError) {
      navigate("/chats")
      notification.showError("somethingWentWrong")
    }
  }, [isError, isSupportRoute, navigate, notification])

  // Keep closed chats open in readonly mode, do not force redirect.

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [adaptedMessages.length])

  useEffect(() => {
    if (partnerTyping) scrollToBottom()
  }, [partnerTyping])

  if (isSupportRoute) {
    return (
      <div className="chat">
        <div className="chats__header-wrapper">
          <div className="chat__header">
            <div className="chats-header__title chat__header-loading">
              <button
                type="button"
                className="chat-header__back-arrow"
                onClick={handleBack}
                aria-label={t("chatBackToList")}
                title={t("chatBackToList")}
              >
                <img src={arrowLeftIcon} alt="" aria-hidden />
              </button>
              <span className="chat-header__name-user">{t("loading")}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || !chatData) {
    return (
      <div className="chat">
        <div className="chats__header-wrapper">
          <div className="chat__header">
            <div className="chats-header__title chat__header-loading">
              <button
                type="button"
                className="chat-header__back-arrow"
                onClick={handleBack}
                aria-label={t("chatBackToList")}
                title={t("chatBackToList")}
              >
                <img src={arrowLeftIcon} alt="" aria-hidden />
              </button>
              <span className="chat-header__name-user">{t("loading")}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="chat">
      <div className="chats__header-wrapper">
        <ChatHeader
          chat={adaptedChatHeader!}
          isFavorite={chatData.chat.isFavorite}
          onBack={handleBack}
          onToggleFavorite={handleToggleFavorite}
          subtitle={isAdminOperatingSupport ? t("adminChats.answerAsSupport") : undefined}
          canShowSubmitWork={
            !!(
              selectedOrderTask &&
              String(selectedOrderTask.performer_id) === String(userId) &&
              performerCanSubmit
            )
          }
          onSubmitWork={() => setIsOpenModalCompleteOrder(true)}
        />

        {selectedOrderTask && requestIds.length > 0 && (
          <div className="chat__task-wrapper">
            <TaskHeader
              isOpen={isOpenTask}
              onToggle={() => setIsOpenTask((prev) => !prev)}
              ordersLength={requestIds.length}
            />

            {isOpenTask && (
              <div className="chat__task-container">
                <TaskSwitcher
                  ordersLength={requestIds.length}
                  selectedIndex={selectedOrderIndex}
                  onChangeIndex={handleChangeSelectedOrderIndex}
                />

                <TaskInfo selectedOrder={selectedOrderTaskWithFreshSubmission ?? selectedOrderTask} />

                {requestData?.status !== "completed" && (
                <div className="chat__task__actions">
                  {/* Кнопка «Принять работу» только для заказчика и только пока решение не принято. */}
                  {isCurrentUserCustomer && submissionPendingDecision && (
                      <TaskPrimaryButton
                        color="green"
                        onClick={() => setIsOpenModalAcceptOrder(true)}
                        icon={checkWhiteIcon}
                        text={t("acceptJob")}
                        disabled={requestData?.status !== "in_progress"}
                        disabledHint={
                          requestData?.status !== "in_progress" ? t("acceptJobAfterSubmit") : undefined
                        }
                      />
                    )}

                  <TaskActions
                    selectedOrder={selectedChatOrderType ?? undefined}
                    onRejectOrder={() => setIsOpenModalRejectOrder(true)}
                    onWriteArbitration={() => setIsOpenModalArbitration(true)}
                    onCancelTask={() => setIsOpenModalCancelTask(true)}
                    isCustomer={isCurrentUserCustomer}
                    canCancelTask={!!canCancelTask}
                    cancelTaskDisabledHint={!canCancelTask ? cancelTaskUnavailableReason || t("taskAlreadyClosed") : undefined}
                    canCreateArbitration={!!canCreateArbitration}
                    arbitrationDisabledHint={
                      !canCreateArbitration ? t("arbitrationOnlyInProgress") : undefined
                    }
                  />
                </div>
                )}
              </div>
            )}
          </div>
        )}

        <EscrowStatus selectedOrder={selectedChatOrderType ?? undefined} />
      </div>

      <div className="chat__container">
        {adaptedMessages.map((msg: Message) => (
          <MessageItem
            key={msg.id}
            message={msg}
            userId={effectiveUserId}
            chatId={id ?? undefined}
            chatResponses={chatData?.responses?.map((r) => ({
              id: r.id,
              requestId: (r as any).request?.id || r.requestId,
              performer: r.performer,
              message: r.message,
              status: r.status,
            }))}
            onCancelOrder={() => setIsOpenModalCancelTask(true)}
            onAcceptOrderRequest={handleAcceptOrderFromMessage}
          />
        ))}
        {partnerTyping ? (
          <div className="chat__typing-row" aria-live="polite">
            <div className="chat__typing-bubble">
              <span className="chat__typing-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span className="chat__typing-text">
                {adaptedChatHeader
                  ? `${adaptedChatHeader.first_name} ${adaptedChatHeader.last_name ?? ""} ${t("chatTypingPartner")}`.trim()
                  : t("chatTypingPartner")}
              </span>
            </div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {isChatClosedNoDeals ? (
        <div className="message-input-wrapper chat__blocked-message">
          <span>{t("chatClosedNoOrders")}</span>
        </div>
      ) : isBlockedByPendingResponse ? (
        <div className="message-input-wrapper chat__blocked-message">
          <span>{t("waitCustomerDecision")}</span>
        </div>
      ) : (
        <MessageInput
          value={value}
          onChange={setValue}
          images={images}
          onImagesChange={setImages}
          onImageClick={handleImageClick}
          onSend={handleSendMessage}
          isSending={isSending || isUploadingLocalFiles}
        />
      )}

      {selectedImageIndex !== null && images.length > 0 && (
        <ImageViewer
          images={images.filter((img) => img.mediaType !== "video").map((img) => img.url)}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}

      <Modal
        isOpen={isOpenModalAcceptOrder}
        onClose={() => {
          setIsOpenModalAcceptOrder(false)
          setSelectedStarRating(0)
          setFeedback("")
        }}
      >
        <AcceptOrderModal
          selectedStarRating={selectedStarRating}
          feedback={feedback}
          onRatingChange={setSelectedStarRating}
          onFeedbackChange={setFeedback}
          onConfirm={handleCompleteRequest}
          onCancel={() => {
            setIsOpenModalAcceptOrder(false)
            setSelectedStarRating(0)
            setFeedback("")
          }}
          isLoading={isCompleting}
        />
      </Modal>

      <Modal isOpen={isOpenModalRejectOrder} onClose={() => setIsOpenModalRejectOrder(false)}>
        <ModalContent
          icon={cancelCrossIcon}
          title={t("cancelTheOrder")}
          description={t("sureCancelTheOrder")}
          confirmText={t("yes")}
          cancelText={t("no")}
          onConfirm={handleCancelRequest}
          onCancel={() => setIsOpenModalRejectOrder(false)}
          isLoading={isCancelling}
        />
      </Modal>

      <Modal isOpen={isOpenModalCancelTask} onClose={() => setIsOpenModalCancelTask(false)}>
        <ModalContent
          icon={cancelCrossIcon}
          title={t("cancelTaskConfirm")}
          description={canCancelTask ? t("cancelTaskDescription") : cancelTaskUnavailableReason || t("taskAlreadyClosed")}
          confirmText={t("yes")}
          cancelText={t("no")}
          onConfirm={handleCancelRequest}
          onCancel={() => setIsOpenModalCancelTask(false)}
          isLoading={isCancelling}
        />
      </Modal>

      <Modal isOpen={isOpenModalCompleteOrder} onClose={() => setIsOpenModalCompleteOrder(false)}>
        <UploadWorkModal
          isUploading={isUploadingSubmission}
          onConfirm={handleUploadSubmission}
          onCancel={() => setIsOpenModalCompleteOrder(false)}
        />
      </Modal>

      <Modal isOpen={isOpenModalArbitration} onClose={() => setIsOpenModalArbitration(false)}>
        <CreateArbitrationModal
          isCreating={isCreatingArbitration}
          onConfirm={handleCreateArbitration}
          onCancel={() => setIsOpenModalArbitration(false)}
        />
      </Modal>
    </div>
  )
}

export default Chat
