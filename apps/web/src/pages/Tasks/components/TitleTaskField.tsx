import CustomerBanner from "./CustomerBanner"
import pencilIcon from "../../../assets/icons/actions/pencil.svg"
import { useTranslation } from "react-i18next"

interface TitleTaskFieldProps {
  value: string
  onChange: (value: string) => void
  isValid: boolean
  warningFieldsFlag: boolean
}

const TitleTaskField = ({ value, onChange, isValid, warningFieldsFlag }: TitleTaskFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={pencilIcon} title={t("tasksPage.titleTask")} isValid={isValid}>
      <input
        type="text"
        className={`title__input ${warningFieldsFlag && !isValid ? "warning" : ""}`}
        placeholder={t("tasksPage.placeholderTitleTask")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </CustomerBanner>
  )
}

export default TitleTaskField
