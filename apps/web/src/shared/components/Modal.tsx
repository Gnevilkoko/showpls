import { useEffect, useRef, type ReactNode } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  const startTouchRef = useRef<{ clientY: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Блокируем прокрутку body когда модалка открыта
  useEffect(() => {
    if (isOpen) {
      // Сохраняем текущую позицию прокрутки
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      document.body.style.overflow = "hidden"

      return () => {
        // Восстанавливаем прокрутку при закрытии
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        document.body.style.overflow = ""
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Обработка touch-событий с использованием нативных обработчиков
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper || !isOpen) return

    const handleTouchStart = (e: TouchEvent) => {
      startTouchRef.current = e.touches[0] ? { clientY: e.touches[0].clientY } : null
    }

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const modal = wrapper.querySelector(".modal") as HTMLElement

      if (!modal || !target) return

      if (!modal.contains(target)) return

      // Находим прокручиваемый элемент
      let scrollableElement: HTMLElement | null = null
      let currentElement: HTMLElement | null = target

      while (currentElement && currentElement !== wrapper) {
        const style = window.getComputedStyle(currentElement)
        const isScrollable =
          currentElement.scrollHeight > currentElement.clientHeight &&
          (style.overflowY === "auto" ||
            style.overflowY === "scroll" ||
            style.overflow === "auto" ||
            style.overflow === "scroll")

        if (isScrollable) {
          scrollableElement = currentElement
          break
        }
        currentElement = currentElement.parentElement
      }

      if (!scrollableElement && modal.scrollHeight > modal.clientHeight) {
        scrollableElement = modal
      }

      if (scrollableElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement
        const isAtTop = scrollTop <= 0
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

        const touch = e.touches[0]
        const startTouch = startTouchRef.current || touch
        const deltaY = touch.clientY - startTouch.clientY

        if ((deltaY > 0 && isAtTop) || (deltaY < 0 && isAtBottom)) {
          e.preventDefault()
          e.stopPropagation()
        }

        startTouchRef.current = touch
      } else {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // Добавляем обработчики с опцией { passive: false }
    wrapper.addEventListener("touchstart", handleTouchStart, { passive: true })
    wrapper.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => {
      wrapper.removeEventListener("touchstart", handleTouchStart)
      wrapper.removeEventListener("touchmove", handleTouchMove)
    }
  }, [isOpen])

  // Предотвращаем прокрутку родительского элемента
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Находим элемент, на котором произошло событие
    const target = e.target as HTMLElement
    const modal = e.currentTarget.querySelector(".modal") as HTMLElement

    if (!modal || !target) return

    // Проверяем, что событие произошло внутри модалки
    if (!modal.contains(target)) return

    // Находим ближайший прокручиваемый родительский элемент
    let scrollableElement: HTMLElement | null = null
    let currentElement: HTMLElement | null = target

    while (currentElement && currentElement !== e.currentTarget) {
      const style = window.getComputedStyle(currentElement)
      const isScrollable =
        currentElement.scrollHeight > currentElement.clientHeight &&
        (style.overflowY === "auto" ||
          style.overflowY === "scroll" ||
          style.overflow === "auto" ||
          style.overflow === "scroll")

      if (isScrollable) {
        scrollableElement = currentElement
        break
      }
      currentElement = currentElement.parentElement
    }

    // Если не нашли прокручиваемый элемент, проверяем сам modal
    if (!scrollableElement && modal.scrollHeight > modal.clientHeight) {
      scrollableElement = modal
    }

    if (scrollableElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableElement
      const isAtTop = scrollTop <= 0
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1

      // Если прокрутка вверх и мы наверху, или прокрутка вниз и мы внизу - блокируем
      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        e.preventDefault()
        e.stopPropagation()
      }
    } else {
      // Если нет прокручиваемого элемента, блокируем все прокрутки
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={`modal__wrapper ${isOpen ? "active" : ""}`}
      onClick={onClose}
      onWheel={handleWheel}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content-container">{children}</div>

        <button className="modal__close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Modal
