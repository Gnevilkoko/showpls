import { useTranslation } from "react-i18next"
import acceptCheckIcon from "../../../assets/icons/status/accept-check.svg"
import StarRating from "./StarRating"

interface AcceptOrderModalProps {
  selectedStarRating: number
  feedback: string
  onRatingChange: (rating: number) => void
  onFeedbackChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

const AcceptOrderModal = ({
  selectedStarRating,
  feedback,
  onRatingChange,
  onFeedbackChange,
  onConfirm,
  onCancel,
  isLoading = false,
}: AcceptOrderModalProps) => {
  const { t } = useTranslation()

  return (
    <>
      <img src={acceptCheckIcon} alt="Accept Check Icon" />

      <div className="accept-job-title-wrapper">
        <h2>{t("acceptJob")}</h2>
        <span>{t("shareYourFeedback")}</span>
      </div>

      <StarRating rating={selectedStarRating} maxRating={5} onRatingChange={onRatingChange} />

      <div className="feedback_container">
        <span>{t("yourFeedback")}</span>
        <textarea value={feedback} onChange={(e) => onFeedbackChange(e.target.value)} placeholder={t("enterFeedbackHere")} />
      </div>

      <div className="modal-actions">
        <button className="modal-action-btn blue" onClick={onCancel} type="button">
          {t("close")}
        </button>

        <button className="modal-action-btn green" onClick={onConfirm} type="button" disabled={isLoading}>
          {t("accept")}
        </button>
      </div>
    </>
  )
}

export default AcceptOrderModal
