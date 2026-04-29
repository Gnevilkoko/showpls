import { useTranslation } from "react-i18next"
import CustomerBanner from "./CustomerBanner"
import coinsIcon from "../../../assets/icons/ui/coins.svg"

interface BudgetFieldProps {
  budget: string
  setBudget: (budget: string) => void
  isValid: boolean
  warningFieldsFlag: boolean
}

const BudgetField = ({ budget, setBudget, isValid, warningFieldsFlag }: BudgetFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={coinsIcon} title={t("tasksPage.budget")} isValid={isValid}>
      <input
        type="number"
        inputMode="numeric" // открывает цифровую клавиатуру на мобилках
        placeholder={t("tasksPage.budgetPlaceholder")}
        className={`budget-input ${warningFieldsFlag && !isValid ? "warning" : ""}`}
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      />
    </CustomerBanner>
  )
}

export default BudgetField
