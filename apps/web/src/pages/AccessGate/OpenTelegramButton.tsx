import telegramLogo from "../../assets/images/telegram-logo.svg"
import { BOT_USERNAME } from "../../constants"

const TG_SCHEME = `tg://resolve?domain=${BOT_USERNAME}`
const TME_LINK = `https://t.me/${BOT_USERNAME}`

const OpenTelegramButton = () => {
  const handleOpenTg = () => {
    // открываем нативное приложение
    window.location.href = TG_SCHEME

    setTimeout(() => {
      // если пользователь не ушёл в нативное приложение, то
      // открываем новую вкладку с приглосом
      if (!document.hidden) {
        window.open(TME_LINK, "_blank", "noopener")
      }
    }, 700)
  }

  return (
    <button className="access-gate__button-switch-telegram" onClick={handleOpenTg}>
      <img src={telegramLogo} alt="Telegram Logo" />

      <span>Continue with Telegram</span>
    </button>
  )
}

export default OpenTelegramButton
