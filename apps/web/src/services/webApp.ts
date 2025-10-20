class TelegramWebAppService {
  private _webApp: typeof window.Telegram.WebApp | null = null;

  init() {
    this._webApp = window.Telegram?.WebApp || null;
    if (this._webApp) {
      this._webApp.expand();
    }
  }

  get webApp() {
    return this._webApp;
  }

  get user() {
    return this._webApp?.initDataUnsafe?.user || null;
  }
}

export const tgService = new TelegramWebAppService();
