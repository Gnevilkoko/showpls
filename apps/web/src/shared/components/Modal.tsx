import { useEffect, type ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  modalClassName?: string
}

const Modal = ({ isOpen, onClose, children, modalClassName }: ModalProps) => {
  // Блокируем прокрутку body когда модалка открыта
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      document.body.style.overflow = "hidden"

      return () => {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        document.body.style.overflow = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Предотвращаем прокрутку wrapper при прокрутке внутри модалки
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const modal = e.currentTarget.querySelector(".modal") as HTMLElement
    const target = e.target as HTMLElement

    if (!modal || !target || !modal.contains(target)) return

    // Блокируем прокрутку wrapper, если событие происходит внутри модалки
    e.stopPropagation()
  }

  if (!isOpen) return null

  return (
    <div className={`modal__wrapper ${isOpen ? "active" : ""}`} onClick={onClose} onWheel={handleWheel}>
      <div className={`modal ${modalClassName ?? ""}`.trim()} onClick={(e) => e.stopPropagation()}>
        <div className="modal-content-container">{children}</div>

        <button className="modal__close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Modal
