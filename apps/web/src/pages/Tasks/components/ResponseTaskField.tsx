import CustomerBanner from "./CustomerBanner"
import pencilIcon from "../../../assets/icons/actions/pencil.svg"
import { useTranslation } from "react-i18next"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"

interface ResponseTaskFieldProps {
  value: string
  onChange: (value: string) => void
  isValid: boolean
  handleRespondToTask: () => void
}

const ResponseTaskField = ({ value, onChange, isValid, handleRespondToTask }: ResponseTaskFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={pencilIcon} title={t("responseTask")} isValid={isValid} padding="none">
      <textarea
        className={`describe__input ${!isValid ? "warning" : ""}`}
        placeholder={t("placeholderResponseTask")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />

      <TaskPrimaryButton color="green" onClick={handleRespondToTask} icon={penWhiteIcon} text={t("respondToTheTask")} />
    </CustomerBanner>
  )
}

export default ResponseTaskField
