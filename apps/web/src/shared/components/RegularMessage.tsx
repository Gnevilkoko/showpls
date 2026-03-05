import { useEffect, useRef, useState, useCallback } from "react"
import { formatTimeFromEpochMs } from "../format"
import checkReadIcon from "../../assets/icons/status/check-read.svg"
import checkReadWhiteIcon from "../../assets/icons/status/check-read-white.svg"
import ImageViewer from "./ImageViewer"
import type { Message } from "../types"

interface RegularMessageProps {
  message: Message
  userId: number
}

const RegularMessage = ({ message, userId }: RegularMessageProps) => {
  const time = formatTimeFromEpochMs(message.created_at)
  const isOwnMessage = message.sender_id === userId
  const textRef = useRef<HTMLSpanElement>(null)
  const [isTextWrapped, setIsTextWrapped] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

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
        <div className={`message ${isOwnMessage ? "green" : ""} ${!message.text ? "image" : ""}`}>
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
