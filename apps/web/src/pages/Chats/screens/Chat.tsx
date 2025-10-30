import { useState, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { ChatOrderType, ChatType, Message, TaskType } from "../../../shared/types"
import ChatHeader from "../components/ChatHeader"
import MessageItem from "../components/MessageItem"
import MessageInput from "../components/MessageInput"
import Modal from "../../../shared/components/Modal"
import EscrowStatus from "../components/EscrowStatus"
import ModalContent from "../components/ModalContent"
import TaskActions from "../components/TaskActions"
import TaskInfo from "../../../shared/components/TaskInfo"
import TaskHeader from "../components/TaskHeader"
import TaskSwitcher from "../components/TaskSwitcher"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import AcceptOrderModal from "../components/AcceptOrderModal"
import ImageViewer from "../../../shared/components/ImageViewer"
import type { UploadedImageType } from "../../../shared/types"
import { chatData } from "../data/chatData"
import acceptCheckIcon from "../../../assets/icons/status/accept-check.svg"
import cancelCrossIcon from "../../../assets/icons/status/cancel-cross.svg"
import { useNotification } from "../../../shared/hooks/useNotification"
import ChatArbitration from "./ChatArbitration"
import checkWhiteIcon from "../../../assets/icons/status/check-white.svg"
import cameraWhiteIcon from "../../../assets/icons/actions/camera-white.svg"

interface ChatProps {
  chat: ChatType
  handleOpenChat: (chat: null) => void
}

const Chat = ({ chat, handleOpenChat }: ChatProps) => {
  // здесь нужно брать свой айдишник из user
  const userId = 100

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
  const [images, setImages] = useState<UploadedImageType[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const selectedOrder = useMemo(() => chat.orders?.[selectedOrderIndex], [chat.orders, selectedOrderIndex])

  const [isOpenChatArbitration, setIsOpenChatArbitration] = useState<boolean>(false)

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  const handleChangeSelectedOrderIndex = useCallback(
    (id: number) => {
      if (!chat.orders) {
        return
      }

      if (id > chat.orders?.length - 1) {
        setSelectedOrderIndex(0)
      } else if (id < 0) {
        setSelectedOrderIndex(chat.orders?.length - 1)
      } else {
        setSelectedOrderIndex(id)
      }
    },
    [chat.orders]
  )

  const chatdataItem = chatData.find((i) => i.chat_id === chat.chat_id)

  if (!chat) {
    notification.showError("somethingWentWrong")
    return null
  }

  if (isOpenChatArbitration) {
    return (
      <ChatArbitration
        selectedOrder={selectedOrder as ChatOrderType}
        handleCloseArbitration={() => setIsOpenChatArbitration(false)}
      />
    )
  }

  return (
    <div className="chat">
      <div className="chats__header-wrapper">
        <ChatHeader
          chat={chat}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onBack={() => handleOpenChat(null)}
        />

        {chat.orders?.[selectedOrderIndex] && (
          <div className="chat__task-wrapper">
            <TaskHeader
              isOpen={isOpenTask}
              onToggle={() => setIsOpenTask((prev) => !prev)}
              ordersLength={chat.orders.length}
            />

            {isOpenTask && (
              <div className="chat__task-container">
                <TaskSwitcher
                  ordersLength={chat.orders.length}
                  selectedIndex={selectedOrderIndex}
                  onChangeIndex={handleChangeSelectedOrderIndex}
                />

                <TaskInfo selectedOrder={selectedOrder?.order as TaskType} />

                <div className="chat__task__actions">
                  <TaskPrimaryButton
                    onClick={() =>
                      selectedOrder?.order.customer_id === userId
                        ? setIsOpenModalAcceptOrder(true)
                        : setIsOpenModalCompleteOrder(true)
                    }
                    icon={selectedOrder?.order.customer_id === userId ? checkWhiteIcon : cameraWhiteIcon}
                    text={selectedOrder?.order.customer_id === userId ? t("acceptJob") : t("upload")}
                  />

                  <TaskActions
                    selectedOrder={selectedOrder}
                    onRejectOrder={() => setIsOpenModalRejectOrder(true)}
                    onWriteArbitration={() => setIsOpenChatArbitration(true)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <EscrowStatus selectedOrder={selectedOrder} />
      </div>

      <div className="chat__container">
        {chatdataItem?.messages.map((msg: Message) => (
          <MessageItem key={msg.id} message={msg} userId={userId} />
        ))}
      </div>

      <MessageInput
        value={value}
        onChange={setValue}
        images={images}
        onImagesChange={setImages}
        onImageClick={handleImageClick}
      />

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && images.length > 0 && (
        <ImageViewer
          images={images.map((img) => img.url)}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}

      <Modal isOpen={isOpenModalAcceptOrder} onClose={() => setIsOpenModalAcceptOrder(false)}>
        <AcceptOrderModal
          selectedStarRating={selectedStarRating}
          onRatingChange={setSelectedStarRating}
          onConfirm={() => {
            setIsOpenModalAcceptOrder(false)
            notification.showSuccess("orderAcceptedSuccessfully")
          }}
          onCancel={() => setIsOpenModalAcceptOrder(false)}
        />
      </Modal>

      <Modal isOpen={isOpenModalRejectOrder} onClose={() => setIsOpenModalRejectOrder(false)}>
        <ModalContent
          icon={cancelCrossIcon}
          title={t("cancelTheOrder")}
          description={t("sureCancelTheOrder")}
          confirmText={t("yes")}
          cancelText={t("no")}
          onConfirm={() => {
            notification.showSuccess("orderCancelledSuccessfully")
            setIsOpenModalRejectOrder(false)
            handleOpenChat(null)
          }}
          onCancel={() => setIsOpenModalRejectOrder(false)}
        />
      </Modal>

      <Modal isOpen={isOpenModalCompleteOrder} onClose={() => setIsOpenModalCompleteOrder(false)}>
        <ModalContent
          icon={acceptCheckIcon}
          title={t("confirmCompletion")}
          description={t("confirmCompletionDescription")}
          confirmText={t("yes")}
          cancelText={t("no")}
          onConfirm={() => {
            notification.showSuccess("orderCompletedSuccessfully")
            setIsOpenModalCompleteOrder(false)
          }}
          onCancel={() => setIsOpenModalCompleteOrder(false)}
        />
      </Modal>
    </div>
  )
}

export default Chat
