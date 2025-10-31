import { useTranslation } from "react-i18next"
import acceptCheckIcon from "../../../assets/icons/status/accept-check.svg"
import StarRating from "./StarRating"

interface AcceptOrderModalProps {
  selectedStarRating: number
  onRatingChange: (rating: number) => void
  onConfirm: () => void
  onCancel: () => void
}

const AcceptOrderModal = ({ selectedStarRating, onRatingChange, onConfirm, onCancel }: AcceptOrderModalProps) => {
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
        <textarea placeholder={t("enterFeedbackHere")} />
      </div>

      <div className="modal-actions">
        <button className="modal-action-btn blue" onClick={onCancel} type="button">
          {t("close")}
        </button>

        <button className="modal-action-btn green" onClick={onConfirm} type="button">
          {t("accept")}
        </button>
      </div>
    </>
  )
}

export default AcceptOrderModal
