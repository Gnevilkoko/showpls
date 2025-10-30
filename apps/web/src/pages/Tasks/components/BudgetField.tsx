import { useTranslation } from "react-i18next"
import CustomerBanner from "./CustomerBanner"
import coinsIcon from "../../../assets/icons/ui/coins.svg"

interface BudgetFieldProps {
  budget: string
  setBudget: (budget: string) => void
}

const BudgetField = ({ budget, setBudget }: BudgetFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={coinsIcon} title={t("tasksPage.budget")} isValid={budget.trim().length > 0}>
      <input
        type="number"
        inputMode="numeric" // открывает цифровую клавиатуру на мобилках
        placeholder={t("tasksPage.budgetPlaceholder")}
        className="budget-input"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      />
    </CustomerBanner>
  )
}

export default BudgetField
