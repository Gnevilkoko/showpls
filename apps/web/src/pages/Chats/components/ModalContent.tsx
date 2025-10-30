import type { ReactNode } from "react"

interface ModalContentProps {
  icon: string
  title: string
  description: string
  onConfirm: () => void
  onCancel?: () => void
  confirmText: string
  cancelText: string
  children?: ReactNode
}

const ModalContent = ({
  icon,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  children,
}: ModalContentProps) => {
  return (
    <>
      <img src={icon} alt="Modal Icon" />

      <div className="accept-job-title-wrapper">
        <h2>{title}</h2>
        <span>{description}</span>
      </div>

      {children}

      <div className="modal-actions">
        {onCancel && (
          <button className="modal-action-btn blue" onClick={onCancel} type="button">
            {cancelText}
          </button>
        )}

        <button className="modal-action-btn green" onClick={onConfirm} type="button">
          {confirmText}
        </button>
      </div>
    </>
  )
}

export default ModalContent
