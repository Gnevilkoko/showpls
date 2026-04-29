import { useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"

// top - скролл вверх
// bottom - скролл вниз
// none - не скроллим
// restore - восстанавливает позицию
const scrollRules = {
  "/chats": "restore",
  "/chat": "restore",
}

const ScrollManager = () => {
  const { pathname } = useLocation()

  const savedScroll = useRef<Record<string, number>>({})

  useEffect(() => {
    // Восстановление позиции, если она была сохранена
    const rule = Object.keys(scrollRules).find((key) => pathname.startsWith(key))
    const behavior = rule ? scrollRules[rule as keyof typeof scrollRules] : "top"

    if (behavior === "none") {
      // Не скроллим, управление скроллом в самом компоненте
      return
    }

    if (behavior === "restore" && savedScroll.current[pathname] != null) {
      window.scrollTo({ top: savedScroll.current[pathname] })
    } else if (behavior === "top") {
      window.scrollTo({ top: 0 })
    } else if (behavior === "bottom") {
      window.scrollTo({
        top: document.body.scrollHeight,
      })
    }

    // Сохраняем текущий скролл при размонтировании (только для путей с "restore")
    const saved = savedScroll.current
    const currentPath = pathname
    return () => {
      if (behavior === "restore") {
        saved[currentPath] = window.scrollY
      }
    }
  }, [pathname])

  return null
}

export default ScrollManager
