import paperclipIcon from "../../assets/icons/ui/paperclip.svg"
import emojiIcon from "../../assets/icons/ui/emoji.svg"
import sendIcon from "../../assets/icons/actions/send.svg"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import type { UploadedImageType } from "../types"
import plusIcon from "../../assets/icons/ui/plus-gray.svg"

type MessageInputProps = {
  value: string
  onChange: (value: string) => void
  images: UploadedImageType[]
  onImagesChange: (images: UploadedImageType[]) => void
  onImageClick: (index: number) => void
}

const MessageInput = ({ value, onChange, images, onImagesChange, onImageClick }: MessageInputProps) => {
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

    const newImages: UploadedImageType[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))

    onImagesChange([...images, ...newImages])
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
          {images.map((img, idx) => (
            <div key={idx} className="preview-attachments">
              <img src={img.url} alt={`preview-${idx}`} onClick={() => onImageClick(idx)} />

              <button className="btn-remove-img" onClick={() => handleRemove(img.url)}>
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="message-input__container">
        <div ref={dropdownRef} className="message-input__actions-wrapper">
          <button className="added-attachments-btn" onClick={handleDropdownToggle} type="button">
            <img src={paperclipIcon} alt="Paperclip Icon" />
          </button>

          {isDropdownOpen && (
            <div className="message-input-dropdown-menu">
              <label className="message-input-dropdown-item">
                <img src={plusIcon} alt="plus Icon" />
                <span>{t("addFiles")}</span>
                <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
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
            ref={textareaRef}
            placeholder={t("message")}
          />

          <button className="message-input__emoji-btn">
            <img src={emojiIcon} alt="Emoji Icon" />
          </button>
        </div>

        <button className="send-message-btn">
          <img src={sendIcon} alt="Send Icon" />
        </button>
      </div>
    </div>
  )
}

export default MessageInput
