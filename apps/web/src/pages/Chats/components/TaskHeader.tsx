import { useTranslation } from "react-i18next"
import arrowDownGreenIcon from "../../../assets/icons/ui/arrow-down-green.svg"

interface TaskHeaderProps {
  isOpen: boolean
  onToggle: () => void
  ordersLength: number
}

const TaskHeader = ({ isOpen, onToggle, ordersLength }: TaskHeaderProps) => {
  const { t } = useTranslation()

  return (
    <div className="chat__task-heder">
      <span>{ordersLength > 1 ? t("tasksDetails", { count: ordersLength }) : t("taskDetails")}</span>

      <button className={`chat__task-show-btn ${isOpen ? "rotated" : ""}`} onClick={onToggle} type="button">
        <span>{isOpen ? t("hide") : t("show")}</span>
        <img src={arrowDownGreenIcon} alt="Arrow Down Icon" />
      </button>
    </div>
  )
}

export default TaskHeader
