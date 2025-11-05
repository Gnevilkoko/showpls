import { useRef, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import menuDotsIcon from "../../../assets/icons/ui/menu-dots.svg"
import closeIcon from "../../../assets/icons/ui/close-icon.svg"
import penIcon from "../../../assets/icons/actions/pen.svg"
import type { ChatOrderType } from "../../../shared/types"

interface TaskActionsProps {
  selectedOrder: ChatOrderType | undefined
  onRejectOrder: () => void
  onWriteArbitration: () => void
}

const TaskActions = ({ selectedOrder, onRejectOrder, onWriteArbitration }: TaskActionsProps) => {
  const { t } = useTranslation()
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <div ref={dropdownRef} className="chat__task__actions-wrapper">
      <button className="chat__task__second-action-btn" onClick={handleDropdownToggle} type="button">
        <img src={menuDotsIcon} alt="Menu Dots Icon" />
      </button>

      {isDropdownOpen && (
        <div className="chat__task__dropdown-menu">
          {selectedOrder?.order.arbitrationApproved && (
            <button className="chat__task__dropdown-item" onClick={onRejectOrder} type="button">
              <img src={closeIcon} alt="Close Icon" />
              <span>{t("cancelOrder")}</span>
            </button>
          )}

          <button className="chat__task__dropdown-item" onClick={onWriteArbitration} type="button">
            <img src={penIcon} alt="Pencil Icon" />
            <span>{t("writeArbitration")}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default TaskActions
