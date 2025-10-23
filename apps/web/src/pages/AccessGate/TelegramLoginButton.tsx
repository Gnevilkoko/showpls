import { useCallback, useEffect, useRef } from "react"
import type { TelegramAuthDataType } from "../../shared/types"
import telegramLogo from "../../assets/images/telegram-logo.svg"

interface TelegramLoginButtonProps {
  botId: string
  onAuthCallback: (data: TelegramAuthDataType) => void
}

const TelegramLoginButton = ({ botId, onAuthCallback }: TelegramLoginButtonProps) => {
  const timeoutRef = useRef<number | undefined>(undefined)
  const popupRef = useRef<Window | null>(null)

  const handleTelegramLogin = useCallback(() => {
    // Telegram auth URL
    const widgetUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${window.location.origin}&request_access=write`

    // Создаём popup для входа
    const popup = window.open(widgetUrl, "_blank", "width=500,height=500")
    popupRef.current = popup

    if (!popup) {
      console.error("Failed to open Telegram authorization window — possibly blocked by browser.")
      return
    }

    // Ждём сообщение из Telegram (данные о пользователе)
    const handleMessage = (event: MessageEvent) => {
      if (["https://oauth.telegram.org", "https://t.me"].includes(event.origin)) {
        try {
          const data = JSON.parse(event.data)
          const result = data.result
          if (result && typeof result === "object") {
            onAuthCallback(result)
          }
        } catch (err) {
          console.error("Telegram auth error:", err)
        } finally {
          // Очищаем все ресурсы
          window.removeEventListener("message", handleMessage)
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close()
          }
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = undefined
          }
        }
      }
    }

    window.addEventListener("message", handleMessage)

    // Таймаут для автоматической очистки (5 минут)
    timeoutRef.current = window.setTimeout(() => {
      window.removeEventListener("message", handleMessage)
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }, 300000) // 5 минут
  }, [botId, onAuthCallback])

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      // Очищаем таймаут
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }

      // Закрываем popup если он открыт
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close()
      }
    }
  }, [])

  return (
    <button className="access-gate__tg-auth-btn" onClick={handleTelegramLogin}>
      <img src={telegramLogo} alt="Telegram Logo" />

      <span>Sign in with Telegram</span>
    </button>
  )
}

export default TelegramLoginButton
