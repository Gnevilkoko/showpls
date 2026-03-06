import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { APIError, Message } from "../../shared/types"
import ChatHeader from "./components/ChatHeader"
import EscrowStatus from "./components/EscrowStatus"
import TaskActions from "./components/TaskActions"
import AcceptOrderModal from "./components/AcceptOrderModal"

import cancelCrossIcon from "../../assets/icons/status/cancel-cross.svg"
import checkWhiteIcon from "../../assets/icons/status/check-white.svg"
import cameraWhiteIcon from "../../assets/icons/actions/camera-white.svg"
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
import CreateArbitrationModal from "./components/CreateArbitrationModal"
import { useNavigate, useParams } from "react-router-dom"
import { useGetChatQuery, useSendMessageMutation, useToggleFavoriteMutation } from "../../store/api/chatApi"
import { useGetRequestQuery, useCompleteRequestMutation, useCancelRequestMutation } from "../../store/api/requestApi"
import { useUploadFileMutation } from "../../store/api/uploadApi"
import { useCreateSubmissionMutation } from "../../store/api/submissionApi"
import { useCreateArbitrationMutation } from "../../store/api/arbitrationApi"
import UploadWorkModal from "./components/UploadWorkModal"
import {
  adaptMessageBackendToMessage,
  adaptRequestToTask,
  type ChatType,
  type ChatOrderType,
  type TaskType,
} from "../../shared/types/adapters"
import { useAppSelector, type RootState } from "../../store"

const Chat = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Берем реальный ID пользователя из Redux
  const userId = useAppSelector((state: RootState) => state.user.userData?.id)

  const { t } = useTranslation()
  const notification = useNotification()

  const [searchValue, setSearchValue] = useState<string>("")
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

  // Получаем данные чата
  const {
    data: chatData,
    isLoading,
    isError,
  } = useGetChatQuery({ id: id!, params: { search: searchValue || undefined } }, { skip: !id })

  const [isUploadingLocalFiles, setIsUploadingLocalFiles] = useState(false)

  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [toggleFavorite, { isLoading: isTogglingFavorite }] = useToggleFavoriteMutation()
  const [uploadFile] = useUploadFileMutation()
  const [createSubmission, { isLoading: isUploadingSubmission }] = useCreateSubmissionMutation()
  const [createArbitration, { isLoading: isCreatingArbitration }] = useCreateArbitrationMutation()
  const [completeRequest, { isLoading: isCompleting }] = useCompleteRequestMutation()
  const [cancelRequest, { isLoading: isCancelling }] = useCancelRequestMutation()

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
      NotificationHandler.showError(error as APIError, "Failed to complete request")
    }
  }

  const handleCancelRequest = async () => {
    if (!currentRequestId) return
    try {
      await cancelRequest(currentRequestId).unwrap()
      setIsOpenModalRejectOrder(false)
      notification.showSuccess("orderCancelledSuccessfully")
    } catch (error) {
      NotificationHandler.showError(error as APIError, "Failed to cancel request")
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
          const result = await uploadFile(img.file).unwrap()
          return result.url
        }
        return img.url
      })
      const attachmentUrls = await Promise.all(uploadPromises)

      await createSubmission({
        requestId: currentRequestId,
        attachments: attachmentUrls,
        proofMeta: geo ? { clientGeo: geo } : undefined,
      }).unwrap()

      notification.showSuccess("orderCompletedSuccessfully")
      setIsOpenModalCompleteOrder(false)
    } catch (error) {
      NotificationHandler.showError(error as APIError, "Failed to submit work")
    }
  }

  const handleSendMessage = async () => {
    if (!value.trim() && images.length === 0) return
    if (isUploadingLocalFiles || isSending) return

    try {
      setIsUploadingLocalFiles(true)
      const uploadPromises = images.map(async (img) => {
        if ((img.url.startsWith("blob:") || img.url.startsWith("http://localhost")) && img.file) {
          const result = await uploadFile(img.file).unwrap()
          return result.url
        }
        return img.url
      })
      const attachmentUrls = await Promise.all(uploadPromises)

      await sendMessage({
        chatId: id!,
        body: {
          text: value.trim() || undefined,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
          type: "message",
        },
      }).unwrap()

      setValue("")
      setImages([])
    } catch (error) {
      NotificationHandler.showError(error as APIError, "Failed to send message")
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
      NotificationHandler.showError(error as APIError, "Failed to create arbitration")
    }
  }

  const handleToggleFavorite = useCallback(() => {
    if (!id || !chatData || isTogglingFavorite) return
    toggleFavorite({
      chatId: id,
      body: { isFavorite: !chatData.chat.isFavorite },
    })
  }, [id, chatData, isTogglingFavorite, toggleFavorite])

  // Собираем все уникальные ID задач, связанных с этим чатом
  const requestIds = useMemo(() => {
    if (!chatData) return []

    const dealRequestIds = chatData.deals?.map((d: any) => d.requestId || d.request?.id).filter(Boolean) || []
    const responseRequestIds = chatData.responses?.map((r: any) => r.requestId || r.request?.id).filter(Boolean) || []

    const ids = [...dealRequestIds, ...responseRequestIds]
    return [...new Set(ids)]
  }, [chatData])

  const currentRequestId = requestIds[selectedOrderIndex]

  const { data: requestData } = useGetRequestQuery(currentRequestId || "", {
    skip: !currentRequestId,
  })

  // Адаптируем запрос к TaskType
  const selectedOrderTask: TaskType | null = useMemo(() => {
    if (!requestData) return null
    return adaptRequestToTask(requestData)
  }, [requestData])

  // Ищем связанную с задачей сделку для статуса Escrow
  const selectedDeal = useMemo(() => {
    if (!chatData || !currentRequestId) return null
    return chatData.deals.find((d: any) => (d.requestId || d.request?.id) === currentRequestId) || null
  }, [chatData, currentRequestId])

  const selectedChatOrderType: ChatOrderType | null = useMemo(() => {
    if (!selectedOrderTask) return null
    return {
      order: selectedOrderTask,
      escrowStatus: selectedDeal?.escrowStatus || null,
    }
  }, [selectedOrderTask, selectedDeal])

  const adaptedMessages: Message[] = useMemo(() => {
    if (!chatData?.messages) return []
    return chatData.messages.map((m) => adaptMessageBackendToMessage(m, undefined))
  }, [chatData?.messages])

  // Адаптируем ChatBackend для ChatHeader
  const adaptedChatHeader: ChatType | null = useMemo(() => {
    if (!chatData) return null
    const otherUser = chatData.chat.user1.id === userId ? chatData.chat.user2 : chatData.chat.user1
    return {
      chat_id: Number(chatData.chat.id),
      avatar: otherUser.avatar,
      first_name: otherUser.firstName,
      last_name: otherUser.lastName,
      last_message: chatData.chat.lastMessage || "",
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
  }, [chatData, userId, selectedChatOrderType, selectedOrderTask])

  const isBlockedByPendingResponse = useMemo(() => {
    if (!chatData || !userId) return false
    const myResponses = chatData.responses?.filter((r: any) => r.performer?.id === userId) || []
    if (myResponses.length === 0) return false
    const myDeals = chatData.deals?.filter((d: any) => d.performer?.id === userId || d.customer?.id === userId) || []
    if (myDeals.length > 0) return false

    return myResponses.some((r: any) => r.status === "pending")
  }, [chatData, userId])

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  const handleBack = () => {
    navigate("/chats")
  }

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
    if (isError) {
      navigate("/chats")
      notification.showError("somethingWentWrong")
    }
  }, [isError, navigate, notification])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [adaptedMessages.length])

  if (isLoading || !chatData) {
    return <div className="chat loading-chats-paragraph visible">{t("loading")}</div>
  }

  return (
    <div className="chat">
      <div className="chats__header-wrapper">
        <ChatHeader
          chat={adaptedChatHeader!}
          isFavorite={chatData.chat.isFavorite}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onBack={handleBack}
          onToggleFavorite={handleToggleFavorite}
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

                <TaskInfo selectedOrder={selectedOrderTask} />

                <div className="chat__task__actions">
                  <TaskPrimaryButton
                    color="green"
                    onClick={() =>
                      selectedOrderTask.customer_id === userId
                        ? setIsOpenModalAcceptOrder(true)
                        : setIsOpenModalCompleteOrder(true)
                    }
                    icon={selectedOrderTask.customer_id === userId ? checkWhiteIcon : cameraWhiteIcon}
                    text={selectedOrderTask.customer_id === userId ? t("acceptJob") : t("upload")}
                  />

                  <TaskActions
                    selectedOrder={selectedChatOrderType ?? undefined}
                    onRejectOrder={() => setIsOpenModalRejectOrder(true)}
                    onWriteArbitration={() => setIsOpenModalArbitration(true)}
                  />
                </div>
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
            userId={userId}
            chatResponses={chatData?.responses?.map((r) => ({
              id: r.id,
              requestId: (r as any).request?.id || r.requestId,
              performer: r.performer,
              message: r.message,
              status: r.status,
            }))}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isBlockedByPendingResponse ? (
        <div
          className="message-input-wrapper chat__blocked-message"
          style={{ justifyContent: "center", padding: "20px", color: "var(--text-secondary)" }}
        >
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
