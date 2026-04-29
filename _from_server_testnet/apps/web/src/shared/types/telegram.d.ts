declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            photo_url?: string
          }
          query_id?: string
        }
        expand(): void
        openInvoice(invoiceUrl: string, callback?: (status: "paid" | "failed" | "cancelled") => void): void
        showAlert(message: string, callback?: () => void): void
        showPopup(
          params: {
            title?: string
            message: string
            buttons?: {
              id?: string
              type?: "default" | "ok" | "close" | "cancel"
              text?: string
            }[]
          },
          callback?: (buttonId?: string) => void
        ): void
        close(): void
        ready(): void
        /** Кнопка «Назад» в шапке Mini App (Bot API 6.1+). Без неё пользователи жмут только ✕ и думают, что «в меню не выйти». */
        BackButton?: {
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        MainButton: {
          show(): void
          hide(): void
          setText(text: string): void
          onClick(callback: () => void): void
        }
      }
    }
  }
}

export {}
