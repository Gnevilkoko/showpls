import { useCallback } from "react"
import { NotificationHandler } from "../utils/notificationHandler"

// Хук для удобного использования уведомлений в компонентах
export const useNotification = () => {
  // Основной метод для обработки ошибок
  const handleError = useCallback((error: unknown, fallbackMessage?: string) => {
    NotificationHandler.handleError(error, fallbackMessage)
  }, [])

  // Методы для показа уведомлений с переводами
  const showSuccess = useCallback((key: string) => {
    NotificationHandler.showSuccessTranslated(key)
  }, [])

  const showInfo = useCallback((key: string) => {
    NotificationHandler.showInfoTranslated(key)
  }, [])

  const showWarning = useCallback((key: string) => {
    NotificationHandler.showWarningTranslated(key)
  }, [])

  const showError = useCallback((key: string) => {
    NotificationHandler.showErrorTranslated(key)
  }, [])

  return {
    handleError,
    showSuccess,
    showInfo,
    showWarning,
    showError,
  }
}
