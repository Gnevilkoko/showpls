import { useEffect, useRef, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { formatTimeFromEpochMs } from "../format"
import checkReadIcon from "../../assets/icons/status/check-read.svg"
import checkReadWhiteIcon from "../../assets/icons/status/check-read-white.svg"
import menuDotsIcon from "../../assets/icons/ui/menu-dots.svg"
import ImageViewer from "./ImageViewer"
import { useDeleteMessageMutation } from "../../store/api/chatApi"
import { NotificationHandler } from "../utils/notificationHandler"
import type { Message } from "../types"

interface RegularMessageProps {
  message: Message
  userId: number
  chatId?: string
}

const RegularMessage = ({ message, userId, chatId }: RegularMessageProps) => {
  const { t } = useTranslation()
  const time = formatTimeFromEpochMs(message.created_at)
  const isOwnMessage = String(message.sender_id) === String(userId)
  const textRef = useRef<HTMLSpanElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isTextWrapped, setIsTextWrapped] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageMutation()

  const canDelete = isOwnMessage && chatId && !isDeleting

  const handleDelete = useCallback(() => {
    setMenuOpen(false)
    if (!chatId || isDeleting) return
    if (!window.confirm(t("confirmDeleteMessage"))) return
    deleteMessage({ chatId, messageId: String(message.id) })
      .unwrap()
      .then(() => NotificationHandler.showSuccessTranslated("messageDeleted"))
      .catch(() => NotificationHandler.showErrorTranslated("somethingWentWrong"))
  }, [chatId, message.id, deleteMessage, isDeleting, t])

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  useEffect(() => {
    const checkTextWrap = () => {
      if (textRef.current) {
        const textElement = textRef.current
        const lineHeight = parseInt(getComputedStyle(textElement).lineHeight)
        const isWrapped = textElement.offsetHeight > lineHeight * 1.5
        setIsTextWrapped(isWrapped)
      }
    }

    checkTextWrap()
    window.addEventListener("resize", checkTextWrap)
    return () => window.removeEventListener("resize", checkTextWrap)
  }, [message.text])

  const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url)

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index)
  }, [])

  const handleCloseImageViewer = useCallback(() => {
    setSelectedImageIndex(null)
  }, [])

  return (
    <>
      <div className={`message__wrapper ${isOwnMessage ? "right" : "left"}`}>
        <div
          className={`message ${isOwnMessage ? "green" : ""} ${!message.text ? "image" : ""} ${canDelete ? "message--with-actions" : ""}`}
        >
          {canDelete && (
            <div className={`message__actions ${menuOpen ? "message__actions--open" : ""}`} ref={menuRef}>
              <button
                type="button"
                className="message__actions-trigger"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setMenuOpen((v) => !v)
                }}
                aria-label={t("deleteMessage")}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <img src={menuDotsIcon} alt="" />
              </button>
              {menuOpen && (
                <div className="message__actions-menu" role="menu">
                  <button
                    type="button"
                    className="message__actions-menu-item message__actions-menu-item--delete"
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete()
                    }}
                  >
                    {t("deleteMessage")}
                  </button>
                </div>
              )}
            </div>
          )}
          {message.attachments &&
            message.attachments.map((url, idx) =>
              isVideo(url) ? (
                <video key={url} src={url} controls style={{ maxWidth: "100%", borderRadius: "8px" }} />
              ) : (
                <img
                  key={url}
                  src={url}
                  alt="Attachments Image"
                  onClick={() => handleImageClick(idx)}
                  style={{ cursor: "pointer" }}
                />
              )
            )}

          {message.text ? (
            <div className="message__content">
              <span className="message__text" ref={textRef}>
                {message.text}
              </span>
              <div className={`message__info ${isTextWrapped ? "wrapped" : ""}`}>
                <span>{time}</span>
                {message.is_read && <img src={checkReadIcon} alt="Check Read Icon" />}
              </div>
            </div>
          ) : (
            <div className="message__info-blur">
              <span>{time}</span>
              {message.is_read && <img src={checkReadWhiteIcon} alt="Check Read Icon" />}
            </div>
          )}
        </div>
      </div>

      {selectedImageIndex !== null && message.attachments && (
        <ImageViewer
          images={message.attachments.filter((url) => !isVideo(url))}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}
    </>
  )
}

export default RegularMessage
