declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          query_id?: string;
        };
        expand(): void;
        openInvoice(
          invoiceUrl: string,
          callback?: (status: 'paid' | 'failed' | 'cancelled') => void
        ): void;
        showAlert(message: string, callback?: () => void): void;
        showPopup(
          params: {
            title?: string;
            message: string;
            buttons?: {
              id?: string;
              type?: 'default' | 'ok' | 'close' | 'cancel';
              text?: string;
            }[];
          },
          callback?: (buttonId?: string) => void
        ): void;
        close(): void;
        ready(): void;
        MainButton: {
          show(): void;
          hide(): void;
          setText(text: string): void;
          onClick(callback: () => void): void;
        };
      };
    };
  }
}

export {};
