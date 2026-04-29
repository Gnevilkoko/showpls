import { useRef, useEffect, useState, useCallback, type MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import menuDotsIcon from "../../../assets/icons/ui/menu-dots.svg"
import closeIcon from "../../../assets/icons/ui/close-icon.svg"
import penIcon from "../../../assets/icons/actions/pen.svg"
import type { ChatOrderType } from "../../../shared/types"

interface TaskActionsProps {
  selectedOrder: ChatOrderType | undefined
  onRejectOrder: () => void
  onWriteArbitration: () => void
  onCancelTask?: () => void
  isCustomer?: boolean
  canCancelTask?: boolean
  cancelTaskDisabledHint?: string
  canCreateArbitration?: boolean
  arbitrationDisabledHint?: string
}

const TaskActions = ({
  selectedOrder,
  onRejectOrder,
  onWriteArbitration,
  onCancelTask,
  isCustomer,
  canCancelTask = true,
  cancelTaskDisabledHint,
  canCreateArbitration = true,
  arbitrationDisabledHint,
}: TaskActionsProps) => {
  const { t } = useTranslation()
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuPosition({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [])

  const handleDropdownToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    updateMenuPosition()
    setIsDropdownOpen((prev) => !prev)
  }

  const handleDropdownClose = () => {
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    if (!isDropdownOpen) return

    const handleClickOutside = (event: PointerEvent) => {
      const target = event.target as Node | null
      const clickedInsideTrigger = triggerRef.current?.contains(target || null)
      const clickedInsideMenu = menuRef.current?.contains(target || null)
      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false)
      }
    }

    const handleViewportChange = () => {
      updateMenuPosition()
    }

    document.addEventListener("pointerdown", handleClickOutside, true)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside, true)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [isDropdownOpen, updateMenuPosition])

  return (
    <div ref={dropdownRef} className="chat__task__actions-wrapper">
      <button ref={triggerRef} className="chat__task__second-action-btn" onClick={handleDropdownToggle} type="button">
        <img src={menuDotsIcon} alt="Menu Dots Icon" />
      </button>

      {isDropdownOpen && (
        <div
          ref={menuRef}
          className="chat__task__dropdown-menu"
          style={{ position: "fixed", top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
        >
          {isCustomer && onCancelTask && (
            <button
              className="chat__task__dropdown-item"
              onClick={() => {
                if (!canCancelTask) return
                onCancelTask()
                handleDropdownClose()
              }}
              type="button"
              disabled={!canCancelTask}
              title={cancelTaskDisabledHint}
            >
              <img src={closeIcon} alt="Close Icon" />
              <span>{t("cancelTask")}</span>
            </button>
          )}
          {isCustomer && onCancelTask && !canCancelTask && cancelTaskDisabledHint && (
            <div className="chat__task__dropdown-hint">{cancelTaskDisabledHint}</div>
          )}
          {selectedOrder?.order.arbitrationApproved && (
            <button
              className="chat__task__dropdown-item"
              onClick={() => {
                onRejectOrder()
                handleDropdownClose()
              }}
              type="button"
            >
              <img src={closeIcon} alt="Close Icon" />
              <span>{t("cancelOrder")}</span>
            </button>
          )}

          <button
            className="chat__task__dropdown-item"
            onClick={() => {
              if (!canCreateArbitration) return
              onWriteArbitration()
              handleDropdownClose()
            }}
            type="button"
            disabled={!canCreateArbitration}
            title={arbitrationDisabledHint}
          >
            <img src={penIcon} alt="Pencil Icon" />
            <span>{t("writeArbitration")}</span>
          </button>
          {!canCreateArbitration && arbitrationDisabledHint && (
            <div className="chat__task__dropdown-hint">{arbitrationDisabledHint}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default TaskActions
