import CustomerBanner from "./CustomerBanner"
import pencilIcon from "../../../assets/icons/actions/pencil.svg"
import attachIcon from "../../../assets/icons/actions/attach.svg"
import { useTranslation } from "react-i18next"
import type { UploadedImageType } from "../../../shared/types"
import type { ChangeEvent } from "react"

interface DescriptionTaskFieldProps {
  value: string
  onChange: (value: string) => void
  attachmentsList: UploadedImageType[]
  handleUpload: (e: ChangeEvent<HTMLInputElement>) => void
  handleImageClick: (index: number) => void
  handleRemove: (url: string) => void
  isValid: boolean
  warningFieldsFlag: boolean
}

const DescriptionTaskField = ({
  value,
  onChange,
  attachmentsList,
  handleUpload,
  handleImageClick,
  handleRemove,
  isValid,
  warningFieldsFlag,
}: DescriptionTaskFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={pencilIcon} title={t("tasksPage.describeTask")} isValid={isValid}>
      <textarea
        className={`describe__input ${warningFieldsFlag && !isValid ? "warning" : ""}`}
        placeholder={t("tasksPage.placeholderTask")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="customer-banner__description-container">
        {/* Кнопка загрузки */}
        <label className="describe__upload-button">
          <img src={attachIcon} alt="Attach Icon" />

          <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
        </label>

        {/* Превью изображений */}
        {attachmentsList.length !== 0 && (
          <div className="task__attachments">
            {attachmentsList.map((img, idx) => (
              <div key={idx} className="preview-attachments">
                <img src={img.url} alt={`preview-${idx}`} onClick={() => handleImageClick(idx)} />

                <button className="btn-remove-img" onClick={() => handleRemove(img.url)}>
                  x
                </button>
              </div>
            ))}
          </div>
        )}

        {attachmentsList.length === 0 && (
          <div className="customer-banner__description">
            <div className="description__title">{t("tasksPage.addFiles")}</div>

            <span>{t("tasksPage.filesDescription")}</span>
          </div>
        )}
      </div>
    </CustomerBanner>
  )
}

export default DescriptionTaskField
