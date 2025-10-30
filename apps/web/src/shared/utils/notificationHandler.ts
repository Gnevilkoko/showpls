import { toast } from "react-toastify"
import type { APIError, APIErrorCode } from "../types"
import i18n from "../../i18n"

// Обрабатывает уведомления и ошибки API
export class NotificationHandler {
  // Показывает уведомление об ошибке на основе кода ошибки
  static showError(error: APIError, fallbackMessage?: string): void {
    const { errorCode, message } = error.data || {}

    // Приоритет: кастомное сообщение от бэкенда > код ошибки > fallback
    const errorMessage = this.getErrorMessage(message, errorCode, fallbackMessage)
    toast.error(errorMessage)
  }

  // Универсальный метод для получения сообщения об ошибке
  private static getErrorMessage(
    message?: string | object,
    errorCode?: APIErrorCode,
    fallbackMessage?: string
  ): string {
    // 1. Кастомное сообщение от бэкенда (строка)
    if (typeof message === "string") {
      return message
    }

    // 2. Валидационные ошибки (объект)
    if (typeof message === "object" && message !== null) {
      try {
        const errors = Object.values(message).flat()
        if (Array.isArray(errors) && errors.length > 0) {
          return errors.join(", ")
        }
      } catch {
        // Если не удалось распарсить объект ошибок, продолжаем к следующему шагу
      }
    }

    // 3. Сообщение по коду ошибки
    if (errorCode) {
      const errorMessages: Record<APIErrorCode, string> = {
        "business-error": i18n.t("errors.businessError"),
        "validation-error": i18n.t("errors.validationError"),
        "access-denied": i18n.t("errors.accessDenied"),
        unauthorized: i18n.t("errors.unauthorized"),
        "access-token-expired": i18n.t("errors.accessTokenExpired"),
        "internal-server-error": i18n.t("errors.internalServerError"),
        "rate-limited": i18n.t("errors.rateLimited"),
      }

      if (errorMessages[errorCode]) {
        return errorMessages[errorCode]
      }
    }

    // 4. Fallback сообщение или неизвестная ошибка
    return fallbackMessage || i18n.t("errors.unknownError")
  }

  // Проверяет, является ли ошибка API ошибкой
  static isAPIError(error: unknown): error is APIError {
    return (
      typeof error === "object" &&
      error !== null &&
      "data" in error &&
      typeof (error as Record<string, unknown>).data === "object" &&
      (error as Record<string, unknown>).data !== null &&
      "errorCode" in ((error as Record<string, unknown>).data as Record<string, unknown>)
    )
  }

  // Обрабатывает ошибку с автоматическим определением типа
  static handleError(error: unknown, fallbackMessage?: string): void {
    if (this.isAPIError(error)) {
      this.showError(error, fallbackMessage)
    } else if (error instanceof Error) {
      toast.error(error.message || fallbackMessage || i18n.t("errors.unknownError"))
    } else {
      toast.error(fallbackMessage || i18n.t("errors.unknownError"))
    }
  }

  // Универсальный метод для показа уведомлений
  private static showToast(type: "success" | "info" | "warning" | "error", message: string): void {
    toast[type](message)
  }

  // Методы с переводами (основные)
  static showSuccessTranslated(key: string): void {
    this.showToast("success", i18n.t(`success.${key}`))
  }

  static showInfoTranslated(key: string): void {
    this.showToast("info", i18n.t(`info.${key}`))
  }

  static showWarningTranslated(key: string): void {
    this.showToast("warning", i18n.t(`warnings.${key}`))
  }

  static showErrorTranslated(key: string): void {
    this.showToast("error", i18n.t(`errors.${key}`))
  }

  // Прямые методы для кастомных сообщений
  static showSuccess(message: string): void {
    this.showToast("success", message)
  }

  static showInfo(message: string): void {
    this.showToast("info", message)
  }

  static showWarning(message: string): void {
    this.showToast("warning", message)
  }
}
