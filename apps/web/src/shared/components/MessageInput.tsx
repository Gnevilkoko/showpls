import attachIcon from "../../assets/icons/actions/attach.svg"
import emojiIcon from "../../assets/icons/ui/emoji.svg"
import sendIcon from "../../assets/icons/actions/send.svg"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import type { UploadedImageType } from "../types"
import plusIcon from "../../assets/icons/ui/plus.svg"
import { toast } from "react-toastify"

type MessageInputProps = {
  value: string
  onChange: (value: string) => void
  images: UploadedImageType[]
  onImagesChange: (images: UploadedImageType[]) => void
  onImageClick: (index: number) => void
  onSend: () => void
  isSending?: boolean
}

const MessageInput = ({ value, onChange, images, onImagesChange, onImageClick, onSend, isSending }: MessageInputProps) => {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const validFiles: File[] = []

    Array.from(files).forEach((file) => {
      // 10 MB limit
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
      } else {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      const newImages: UploadedImageType[] = validFiles.map((file) => {
        const url = URL.createObjectURL(file)
        const mediaType: UploadedImageType["mediaType"] =
          file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "file"

        return {
          file,
          url,
          mediaType,
        }
      })
      onImagesChange([...images, ...newImages])
    }

    setIsDropdownOpen(false)
    // Сброс input, чтобы можно было выбрать те же файлы снова
    e.target.value = ""
  }

  const handleRemove = (url: string) => {
    onImagesChange(images.filter((img) => img.url !== url))
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = textarea.scrollHeight + "px"
    }
  }, [value])

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

  return (
    <div className="message-input-wrapper">
      {images.length !== 0 && (
        <div className="message-input-attachments">
          {images.map((img, idx) => {
            const isVideo = img.mediaType === "video" || img.file?.type.startsWith("video/")

            return (
              <div key={idx} className="preview-attachments">
                {isVideo ? (
                  <video
                    src={img.url}
                    onClick={() => onImageClick(idx)}
                    style={{ cursor: "pointer" }}
                    muted
                    playsInline
                  />
                ) : (
                  <img src={img.url} alt={`preview-${idx}`} onClick={() => onImageClick(idx)} />
                )}

                <button className="btn-remove-img" onClick={() => handleRemove(img.url)}>
                  x
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="message-input__container">
        <div ref={dropdownRef} className="message-input__actions-wrapper">
          <button className="added-attachments-btn" onClick={handleDropdownToggle} type="button">
            <img src={attachIcon} alt="Attach Icon" />
          </button>

          {isDropdownOpen && (
            <div className="message-input-dropdown-menu">
              <label className="message-input-dropdown-item">
                <img src={plusIcon} alt="plus Icon" />
                <span>{t("addFiles")}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleUpload}
                  style={{ display: "none" }}
                />
              </label>

              <button className="message-input-dropdown-item" type="button">
                <img src={plusIcon} alt="plus Icon" />
                <span>{t("addTask")}</span>
              </button>
            </div>
          )}
        </div>

        <div className="message-input__wrapper">
          <textarea
            className="message-input"
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                if (!isSending) onSend()
              }
            }}
            ref={textareaRef}
            placeholder={t("message")}
            disabled={isSending}
          />

          <button className="message-input__emoji-btn">
            <img src={emojiIcon} alt="Emoji Icon" />
          </button>
        </div>

        <button className="send-message-btn" onClick={onSend} disabled={isSending}>
          <img src={sendIcon} alt="Send Icon" />
        </button>
      </div>
    </div>
  )
}

export default MessageInput
