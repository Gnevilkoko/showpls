import checkWhiteIcon from "../../../assets/icons/status/check-white.svg"
import cameraWhiteIcon from "../../../assets/icons/actions/camera-white.svg"
import { useTranslation } from "react-i18next"
import type { ChatOrderType } from "../../../shared/types"

interface TaskPrimaryButtonProps {
  selectedOrder: ChatOrderType | undefined
  userId: number
  onClick: () => void
}

const TaskPrimaryButton = ({ selectedOrder, userId, onClick }: TaskPrimaryButtonProps) => {
  const { t } = useTranslation()

  const isCustomer = selectedOrder?.order.customer_id === userId
  const iconSrc = isCustomer ? checkWhiteIcon : cameraWhiteIcon
  const buttonText = isCustomer ? t("acceptJob") : t("upload")

  return (
    <button className="chat__task__first-action-btn" onClick={onClick} type="button">
      <img src={iconSrc} alt="Action Icon" />
      <span>{buttonText}</span>
    </button>
  )
}

export default TaskPrimaryButton
