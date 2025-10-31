import type { ChatOrderType, Message, TaskType, UploadedImageType } from "../../shared/types"
import arrowLeftIcon from "../../assets/icons/ui/arrow-left.svg"
import showplsAgentIcon from "../../assets/images/logo-without-text.svg"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import TaskHeader from "../../shared/components/TaskHeader"
import TaskInfo from "../../shared/components/TaskInfo"
import MessageItem from "../../shared/components/MessageItem"
import MessageInput from "../../shared/components/MessageInput"
import Modal from "../../shared/components/Modal"
import ModalContent from "../../shared/components/ModalContent"
import ImageViewer from "../../shared/components/ImageViewer"
import { useNotification } from "../../shared/hooks/useNotification"
import cancelCrossIcon from "../../assets/icons/status/cancel-cross.svg"

interface ChatArbitrationProps {
  selectedOrder: ChatOrderType
  handleCloseArbitration: () => void
}

const ArbitrationMessages: Message[] = [
  {
    id: 1,
    type: "message",
    sender_id: 100,
    receiver_id: 300,
    text: "The performer disappeared without sending the last photo. Can I cancel the order?",
    attachments: [],
    created_at: Date.now(),
    is_read: true,
  },
  {
    id: 2,
    type: "message",
    sender_id: 300,
    receiver_id: 100,
    text: "We see that the performer really disappeared without completing the task. You can cancel the order right now, we will refund your stars within an hour.",
    attachments: [],
    created_at: Date.now(),
    is_read: true,
  },
  {
    id: 3,
    type: "notification",
    variant: "permissionToCancel",
    sender_id: 300,
    receiver_id: 100,
    text: null,
    attachments: [],
    created_at: Date.now(),
    is_read: true,
  },
]

const ChatArbitration = ({ selectedOrder, handleCloseArbitration }: ChatArbitrationProps) => {
  const { t } = useTranslation()
  const notification = useNotification()
  const [isOpenTask, setIsOpenTask] = useState<boolean>(false)
  const [value, setValue] = useState("")
  const userId = 100
  const [isOpenModalRejectOrder, setIsOpenModalRejectOrder] = useState(false)
  const [images, setImages] = useState<UploadedImageType[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  return (
    <div className="chat">
      <div className="chats__header-wrapper">
        <div className="chat__header">
          <div className="chats-header__title">
            <button className="chat-header__back-arrow" onClick={handleCloseArbitration}>
              <img src={arrowLeftIcon} alt="Arrow Left Icon" />
            </button>

            <img src={showplsAgentIcon} alt="User Avatar" className="chat__avatar" />

            <div className="chat-header__user-info">
              <span className="chat-header__name-user">{t("arbitration")}</span>

              <span className="chat-header__online-status">{selectedOrder.order.title}</span>
            </div>
          </div>
        </div>

        <div className="chat__task-wrapper">
          <TaskHeader isOpen={isOpenTask} onToggle={() => setIsOpenTask((prev) => !prev)} ordersLength={1} />

          {isOpenTask && (
            <div className="chat__task-container">
              <TaskInfo selectedOrder={selectedOrder.order as TaskType} />
            </div>
          )}
        </div>
      </div>

      <div className="chat__container">
        {ArbitrationMessages.map((msg: Message) => (
          <MessageItem
            key={msg.id}
            message={msg}
            userId={userId}
            onCancelOrder={() => setIsOpenModalRejectOrder(true)}
          />
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
            handleCloseArbitration()
          }}
          onCancel={() => setIsOpenModalRejectOrder(false)}
        />
      </Modal>
    </div>
  )
}

export default ChatArbitration
