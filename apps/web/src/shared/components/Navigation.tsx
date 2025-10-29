import { useLocation, useNavigate } from "react-router-dom"
// import homeWhiteIcon from "../../assets/icons/navigation/home-white.svg"
// import homeIcon from "../../assets/icons/navigation/home.svg"
// import globalWhiteIcon from "../../assets/icons/ui/global-white.svg"
// import globalIcon from "../../assets/icons/ui/global.svg"
// import chatsWhiteIcon from "../../assets/icons/navigation/chats-white.svg"
// import chatsIcon from "../../assets/icons/navigation/chats.svg"
// import walletWhiteIcon from "../../assets/icons/navigation/wallet-white.svg"
// import walletIcon from "../../assets/icons/navigation/wallet.svg"
// import userWhiteIcon from "../../assets/icons/navigation/user-white.svg"
// import userIcon from "../../assets/icons/navigation/user.svg"
import { useTranslation } from "react-i18next"
import { useEffect, useState } from "react"

import newHomeGradientIcon from "../../assets/icons/navigation/new-home-gradient.svg"
import newHomeWhiteIcon from "../../assets/icons/navigation/new-home-white.svg"
import newTasksGradientIcon from "../../assets/icons/navigation/new-tasks-gradient.svg"
import newTasksWhiteIcon from "../../assets/icons/navigation/new-tasks-white.svg"
import newChatsGradientIcon from "../../assets/icons/navigation/new-chats-gradient.svg"
import newChatsWhiteIcon from "../../assets/icons/navigation/new-chats-white.svg"
import newWalletGradientIcon from "../../assets/icons/navigation/new-wallet-gradient.svg"
import newWalletWhiteIcon from "../../assets/icons/navigation/new-wallet-white.svg"
import newProfileGradientIcon from "../../assets/icons/navigation/new-profile-gradient.svg"
import newProfileWhiteIcon from "../../assets/icons/navigation/new-profile-white.svg"

const Navigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // локальное состояние для плавного включения active после загрузки страницы
  const [activePath, setActivePath] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePath(location.pathname)
    }, 0) // 0 мс задержка что бы отработала анимация появления активной кнопки

    return () => clearTimeout(timer)
  }, [location.pathname])

  const handleClick = (pathName: string) => {
    if (pathName !== location.pathname) {
      navigate(pathName)
    }
  }

  return (
    <nav className="navigation">
      <button className={`nav-button ${activePath === "/home" ? "active" : ""}`} onClick={() => handleClick("/home")}>
        {/* <img src={activePath === "/home" ? homeWhiteIcon : homeIcon} alt="Home Icon" className="nav-button__icon" /> */}
        <img
          src={activePath === "/home" ? newHomeWhiteIcon : newHomeGradientIcon}
          alt="Home Icon"
          className="nav-button__icon"
        />
        <span>{t("home")}</span>
      </button>

      <button className={`nav-button ${activePath === "/tasks" ? "active" : ""}`} onClick={() => handleClick("/tasks")}>
        {/* <img
          src={activePath === "/tasks" ? globalWhiteIcon : globalIcon}
          alt="Tasks Icon"
          className="nav-button__icon"
        /> */}
        <img
          src={activePath === "/tasks" ? newTasksWhiteIcon : newTasksGradientIcon}
          alt="Tasks Icon"
          className="nav-button__icon"
        />

        <span>{t("tasks")}</span>
      </button>

      <button className={`nav-button ${activePath === "/chats" ? "active" : ""}`} onClick={() => handleClick("/chats")}>
        {/* <img src={activePath === "/chats" ? chatsWhiteIcon : chatsIcon} alt="Chats Icon" className="nav-button__icon" /> */}
        <img
          src={activePath === "/chats" ? newChatsWhiteIcon : newChatsGradientIcon}
          alt="Chats Icon"
          className="nav-button__icon"
        />

        <span>{t("chats")}</span>
      </button>

      <button
        className={`nav-button ${activePath === "/wallet" ? "active" : ""}`}
        onClick={() => handleClick("/wallet")}
      >
        {/* <img
          src={activePath === "/wallet" ? walletWhiteIcon : walletIcon}
          alt="Wallet Icon"
          className="nav-button__icon"
        /> */}
        <img
          src={activePath === "/wallet" ? newWalletWhiteIcon : newWalletGradientIcon}
          alt="Wallet Icon"
          className="nav-button__icon"
        />
        <span>{t("wallet")}</span>
      </button>

      <button
        className={`nav-button ${activePath === "/profile" ? "active" : ""}`}
        onClick={() => handleClick("/profile")}
      >
        {/* <img
          src={activePath === "/profile" ? userWhiteIcon : userIcon}
          alt="Profile Icon"
          className="nav-button__icon"
        /> */}
        <img
          src={activePath === "/profile" ? newProfileWhiteIcon : newProfileGradientIcon}
          alt="Profile Icon"
          className="nav-button__icon"
        />
        <span>{t("profile")}</span>
      </button>
    </nav>
  )
}

export default Navigation
