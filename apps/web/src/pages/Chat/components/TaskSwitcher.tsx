import { useTranslation } from "react-i18next"
import arrowLeftIcon from "../../../assets/icons/ui/arrow-left.svg"

interface TaskSwitcherProps {
  ordersLength: number
  selectedIndex: number
  onChangeIndex: (newIndex: number) => void
}

const TaskSwitcher = ({ ordersLength, selectedIndex, onChangeIndex }: TaskSwitcherProps) => {
  const { t } = useTranslation()

  if (ordersLength <= 1) return null

  return (
    <div className="chat__task-switcher">
      <button className="chat__task-switcher-btn" onClick={() => onChangeIndex(selectedIndex - 1)} type="button">
        <img src={arrowLeftIcon} alt="Arrow Left Icon" />
      </button>

      <span>{t("taskNumber", { count: selectedIndex + 1 })}</span>

      <button
        className="chat__task-switcher-btn next-btn"
        onClick={() => onChangeIndex(selectedIndex + 1)}
        type="button"
      >
        <img src={arrowLeftIcon} alt="Arrow Right Icon" />
      </button>
    </div>
  )
}

export default TaskSwitcher
