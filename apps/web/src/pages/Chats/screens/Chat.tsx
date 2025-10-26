import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { ChatType, Message } from "../../../shared/types"
import ChatHeader from "../components/ChatHeader"
import MessageItem from "../components/MessageItem"
import MessageInput from "../components/MessageInput"
import arrowDownGreenIcon from "../../../assets/icons/ui/arrow-down-green.svg"
import { chatData } from "../data/chatData"
import ChatMap from "../components/ChatMap"
import checkWhiteIcon from "../../../assets/icons/status/check-white.svg"
import cameraWhiteIcon from "../../../assets/icons/actions/camera-white.svg"
import menuDotsIcon from "../../../assets/icons/ui/menu-dots.svg"
import starsWhiteIcon from "../../../assets/icons/status/stars-white.svg"
import ImageViewer from "../../../shared/components/ImageViewer"
import lockBlueIcon from "../../../assets/icons/status/lock-blue.svg"
import starsIcon from "../../../assets/icons/status/stars.svg"
import closeIcon from "../../../assets/icons/ui/close-icon.svg"
import closeRedIcon from "../../../assets/icons/ui/close-icon-red.svg"
import penIcon from "../../../assets/icons/ui/pen-gray.svg"
import arrowLeftIcon from "../../../assets/icons/ui/arrow-left.svg"
import verifiedCheckIcon from "../../../assets/icons/status/verified-check.svg"
import starGrayIcon from "../../../assets/icons/status/star-filled-gray.svg"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"
import acceptCheckIcon from "../../../assets/icons/status/accept-check.svg"
import cancelCrossIcon from "../../../assets/icons/status/cancel-cross.svg"
import { useNotification } from "../../../shared/hooks/useNotification"

interface ChatProps {
  chat: ChatType
  handleOpenChat: (chat: null) => void
}

const Chat = ({ chat, handleOpenChat }: ChatProps) => {
  // здесь нужно брать свой айдишник из user
  const userId = 100

  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState<string>("")
  const [value, setValue] = useState("")

  const [isOpenModalAcceptOrder, setIsOpenModalAcceptOrder] = useState(false)
  const [isOpenModalRejectOrder, setIsOpenModalRejectOrder] = useState(false)
  const [isOpenModalCompleteOrder, setIsOpenModalCompleteOrder] = useState(false)

  const [isOpenTask, setIsOpenTask] = useState<boolean>(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0)
  const selectedOrder = useMemo(() => chat.orders?.[selectedOrderIndex], [chat.orders, selectedOrderIndex])

  const arrStarRating = Array.from({ length: 5 }, (_, i) => i)

  const [selectedStarRating, setSelectedStarRating] = useState<number>(0)

  const notification = useNotification()

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

  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleClickTaskShow = () => {
    setIsOpenTask((prev) => !prev)
  }

  const handleImageClick = (imageSrc: string) => {
    if (chat.orders?.[selectedOrderIndex]?.order.attachments) {
      const index = chat.orders?.[selectedOrderIndex]?.order.attachments.indexOf(imageSrc)
      setSelectedImageIndex(index)
    }
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const chatdataItem = chatData.find((i) => i.chat_id === chat.chat_id)

  if (!chat) {
    alert(t("somethingWentWrong"))
    return null
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
            <div className="chat__task-heder">
              <span>
                {chat.orders?.length > 1 ? t("tasksDetails", { count: chat.orders?.length }) : t("taskDetails")}
              </span>

              <button className={`chat__task-show-btn ${isOpenTask ? "rotated" : ""}`} onClick={handleClickTaskShow}>
                <span>{isOpenTask ? t("hide") : t("show")}</span>

                <img src={arrowDownGreenIcon} alt="Arrow Down Icon" />
              </button>
            </div>

            {isOpenTask && (
              <div className="chat__task-container">
                {chat.orders?.length > 1 && (
                  <div className="chat__task-switcher">
                    <button
                      className="chat__task-switcher-btn"
                      onClick={() => handleChangeSelectedOrderIndex(selectedOrderIndex - 1)}
                    >
                      <img src={arrowLeftIcon} alt="Arrow Left Icon" />
                    </button>

                    <span>{t("taskNumber", { count: selectedOrderIndex + 1 })}</span>

                    <button
                      className="chat__task-switcher-btn next-btn"
                      onClick={() => handleChangeSelectedOrderIndex(selectedOrderIndex + 1)}
                    >
                      <img src={arrowLeftIcon} alt="Arrow Right Icon" />
                    </button>
                  </div>
                )}

                <div className="chat__task-info__wrapper">
                  <div className="chat__task-info">
                    <span className="chat__task-info__title">{chat.orders?.[selectedOrderIndex]?.order.title}</span>

                    <span className="chat__task-info__description">
                      {chat.orders?.[selectedOrderIndex]?.order.description}
                    </span>
                  </div>

                  <div className="chat__task-tags">
                    <div className="tag stars">
                      {chat.orders?.[selectedOrderIndex]?.order.price}

                      <span>
                        <img src={starsWhiteIcon} alt="Stars Icon" />
                      </span>
                    </div>

                    {selectedOrder?.order.tags.map((tag, index) => {
                      if (tag.type === "hLeft") {
                        return (
                          <div key={index} className="tag">
                            {t("tasksPage.hLeft", { count: tag.count })}
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>

                {selectedOrder?.order.attachments && selectedOrder.order.attachments.length > 0 && (
                  <div className="task__attachments">
                    {selectedOrder?.order.attachments.map((img, idx) => (
                      <div key={idx} className="preview-attachments" onClick={() => handleImageClick(img)}>
                        <img src={img} alt={`attachments-${idx}`} />
                      </div>
                    ))}
                  </div>
                )}

                {selectedOrder?.order.position && <ChatMap coordinates={selectedOrder?.order.position} />}

                <div className="chat__task__actions">
                  <button
                    className="chat__task__first-action-btn"
                    onClick={() =>
                      selectedOrder?.order.customer_id === userId
                        ? setIsOpenModalAcceptOrder(true)
                        : setIsOpenModalCompleteOrder(true)
                    }
                  >
                    <img
                      src={selectedOrder?.order.customer_id === userId ? checkWhiteIcon : cameraWhiteIcon}
                      alt="Check Icon"
                    />

                    <span>{selectedOrder?.order.customer_id === userId ? t("acceptJob") : t("upload")}</span>
                  </button>

                  <div ref={dropdownRef} className="chat__task__second-action-btn">
                    <button className="chat__task__second-action-btn" onClick={handleDropdownToggle}>
                      <img src={menuDotsIcon} alt="Menu Dots Icon" />
                    </button>

                    {isDropdownOpen && (
                      <div className="chat__task__dropdown-menu">
                        {selectedOrder?.order.arbitrationApproved && (
                          <button className="chat__task__dropdown-item" onClick={() => setIsOpenModalRejectOrder(true)}>
                            <img src={closeIcon} alt="Close Icon" />

                            <span>{t("cancelOrder")}</span>
                          </button>
                        )}

                        <button
                          className="chat__task__dropdown-item"
                          // onClick={}
                        >
                          <img src={penIcon} alt="Pen Icon" />

                          <span>{t("writeArbitration")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedOrder?.escrowStatus === "locked" && (
          <div className="chats__escrow-status-wrapper">
            <div className="chats__escrow-status blue">
              <img src={lockBlueIcon} alt="Lock Icon" />

              <span>
                {t("payment", { count: selectedOrder?.order.price })}
                <img src={starsIcon} alt="Stars Icon" />
                {t("lockedInEscrow")}
              </span>
            </div>
          </div>
        )}

        {selectedOrder?.escrowStatus === "released" && (
          <div className="chats__escrow-status-wrapper">
            <div className="chats__escrow-status green">
              <img src={verifiedCheckIcon} alt="Check Icon" />

              <span>
                {t("payment", { count: selectedOrder?.order.price })}
                <img src={starsIcon} alt="Stars Icon" />
                {t("releasedFromEscrow")}
              </span>
            </div>
          </div>
        )}

        {selectedOrder?.escrowStatus === "rejected" && (
          <div className="chats__escrow-status-wrapper">
            <div className="chats__escrow-status red">
              <img className="escrow-status-icon" src={closeRedIcon} alt="Close Icon" />

              <span>
                {t("payment", { count: selectedOrder?.order.price })}
                <img src={starsIcon} alt="Stars Icon" />
                {t("rejectedFromEscrow")}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="chat__container">
        {chatdataItem?.messages.map((msg: Message) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </div>

      <MessageInput value={value} onChange={setValue} />

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && selectedOrder?.order.attachments && (
        <ImageViewer
          images={selectedOrder?.order.attachments}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}

      <div
        className={`modal__wrapper ${isOpenModalAcceptOrder ? "active" : ""}`}
        onClick={() => setIsOpenModalAcceptOrder(false)}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <img src={acceptCheckIcon} alt="Accept Check Icon" />

          <div className="accept-job-title-wrapper">
            <h2>{t("acceptJob")}</h2>

            <span>{t("shareYourFeedback")}</span>
          </div>

          <div className="star-rating__container">
            {arrStarRating.map((_, index) => {
              return (
                <button key={index} className="star-rating-btn" onClick={() => setSelectedStarRating(index + 1)}>
                  <img src={selectedStarRating >= index + 1 ? starFilledIcon : starGrayIcon} alt="Star Gray Icon" />
                </button>
              )
            })}
          </div>

          <div className="feedback_container">
            <span>{t("yourFeedback")}</span>

            <textarea placeholder={t("enterFeedbackHere")} />
          </div>

          <div className="modal-actions">
            <button className="modal-action-btn blue" onClick={() => setIsOpenModalAcceptOrder(false)}>
              {t("close")}
            </button>

            <button
              className="modal-action-btn green"
              onClick={() => {
                setIsOpenModalAcceptOrder(false)
                notification.showSuccess("orderAcceptedSuccessfully")
              }}
            >
              {t("accept")}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`modal__wrapper ${isOpenModalRejectOrder ? "active" : ""}`}
        onClick={() => setIsOpenModalRejectOrder(false)}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <img src={cancelCrossIcon} alt="Cancel Cross Icon" />

          <div className="accept-job-title-wrapper">
            <h2>{t("cancelTheOrder")}</h2>

            <span>{t("sureCancelTheOrder")}</span>
          </div>

          <div className="modal-actions">
            <button className="modal-action-btn blue" onClick={() => setIsOpenModalRejectOrder(false)}>
              {t("no")}
            </button>

            <button
              className="modal-action-btn green"
              onClick={() => {
                notification.showSuccess("orderCancelledSuccessfully")
                setIsOpenModalRejectOrder(false)
                handleOpenChat(null)
              }}
            >
              {t("yes")}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`modal__wrapper ${isOpenModalCompleteOrder ? "active" : ""}`}
        onClick={() => setIsOpenModalCompleteOrder(false)}
      >
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <img src={acceptCheckIcon} alt="Accept Check Icon" />

          <div className="accept-job-title-wrapper">
            <h2>{t("confirmCompletion")}</h2>

            <span>{t("confirmCompletionDescription")}</span>
          </div>

          <div className="modal-actions">
            <button className="modal-action-btn blue" onClick={() => setIsOpenModalCompleteOrder(false)}>
              {t("no")}
            </button>

            <button
              className="modal-action-btn green"
              onClick={() => {
                notification.showSuccess("orderCompletedSuccessfully")
                setIsOpenModalCompleteOrder(false)
              }}
            >
              {t("yes")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
