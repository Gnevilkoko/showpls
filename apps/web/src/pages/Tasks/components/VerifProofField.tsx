import { useTranslation } from "react-i18next"
import CustomerBanner from "./CustomerBanner"
import securityProofIcon from "../../../assets/icons/ui/security-proof.svg"

interface VerifProofFieldProps {
  verifProof: "base" | "pro"
  handleChangeVerifProof: (value: "base" | "pro") => void
  isValid: boolean
  warningFieldsFlag: boolean
}

const VerifProofField = ({ verifProof, handleChangeVerifProof, isValid, warningFieldsFlag }: VerifProofFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={securityProofIcon} title={t("tasksPage.verifProof")} isValid={isValid}>
      <div className="verification-proof-item">
        <button
          className={`verification-proof-button ${verifProof === "base" ? "active" : ""} ${
            warningFieldsFlag && !isValid ? "warning" : ""
          }`}
          onClick={() => handleChangeVerifProof("base")}
        >
          <span>{t("tasksPage.base")}</span>
        </button>

        <button
          className={`verification-proof-button ${verifProof === "pro" ? "active pro" : ""}`}
          onClick={() => handleChangeVerifProof("pro")}
        >
          <span>{t("tasksPage.pro")}</span>

          <span className="coming-soon">{t("comingSoon")}</span>
        </button>
      </div>

      <div className="customer-banner__description-container">
        <div className="customer-banner__description">
          <span className="description__title">
            {verifProof === "base" ? t("tasksPage.baseTitle") : t("tasksPage.proTitle")}
          </span>

          <span>{verifProof === "base" ? t("tasksPage.baseDescription") : t("tasksPage.proDescription")}</span>
        </div>
      </div>
    </CustomerBanner>
  )
}

export default VerifProofField
