import telegramLogo from "../../assets/images/telegram-logo.svg"
import { TG_SCHEME, TME_LINK } from "../../constants"

const OpenMiniAppButton = () => {
  const handleOpenMiniApp = () => {
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
    <button className="access-gate__button-switch-telegram" onClick={handleOpenMiniApp}>
      <img src={telegramLogo} alt="Telegram Logo" />

      <span>Continue with Mini App</span>
    </button>
  )
}

export default OpenMiniAppButton
