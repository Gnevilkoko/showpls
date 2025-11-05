import walletIcon from "../../assets/images/wallet-new.svg"
import starsIcon from "../../assets/icons/status/stars.svg"
import lockIcon from "../../assets/icons/status/lock.svg"
import { useTranslation } from "react-i18next"
import { useState } from "react"
import { tgService } from "../../services/webApp"
import TonWalletConnect from "./TonWalletConnect"
import Navigation from "../../shared/components/Navigation"
import Modal from "../../shared/components/Modal"
import { useAppSelector } from "../../store"
import OpenTelegramButton from "../AccessGate/OpenTelegramButton"
import { useNotification } from "../../shared/hooks/useNotification"
import TransactionsList from "./components/TransactionsList"

const Wallet = () => {
  const { t } = useTranslation()
  const notification = useNotification()

  const [isOpenModalTopUp, setIsOpenModalTopUp] = useState(false)
  const [activeSection, setActiveSection] = useState<"stars" | "ton">("stars")
  const [stars, setStars] = useState<number>(1)
  const userToken = useAppSelector((state) => state.user.accessToken)

  const isInTelegram = window.Telegram?.WebApp?.initData

  const handleClickOption = (val: "stars" | "ton") => {
    setActiveSection(val)
  }

  const handleClickTopUp = () => {
    setIsOpenModalTopUp(true)
  }

  const handleTopUpStars = async () => {
    const webApp = tgService.webApp

    if (!webApp || !userToken) {
      return
    }

    const res = await fetch(`${window.location.origin}/api/stars-top-up/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ amount: stars }),
    })
    const data = await res.json()
    console.log(data)

    webApp.openInvoice(data.link, (status) => {
      switch (status) {
        case "paid":
          notification.showSuccess("paymentSuccess")
          setIsOpenModalTopUp(false)
          break
        case "cancelled":
          notification.showWarning("paymentCancelled")
          break
        case "failed":
        default:
          notification.showError("paymentFailed")
          break
      }
    })
  }

  return (
    <div className="page wallet">
      <h1 className="wallet-header">{t("wallet")}</h1>

      <div className="wallet-container">
        <div className="wallet__header">
          <div className="wallet__header__title">
            <img src={walletIcon} alt="Wallet Icon" />

            <span>{t("wallet")}</span>
          </div>

          <div className="wallet__stars-status">
            <span className="count-hold-stars">40</span>

            <img src={starsIcon} alt="Telegram Stars Icon" />

            <span className="stars-status">{t("miniWallet.onHold")}</span>
          </div>
        </div>

        <div className="wallet-content__container">
          <div className="wallet-content__wrapper">
            <span className="wallet-content__available">{t("miniWallet.available")}</span>

            <div className="wallet-content">
              <span className="count-stars">120</span>

              <div className="tg-stars-icon__container">
                <img src={starsIcon} alt="Telegram Stars Icon" className="tg-stars-icon" />
              </div>
            </div>
          </div>

          <div className="wallet-content__buttons-container">
            <button className="wallet-content__button green" onClick={handleClickTopUp}>
              {t("topUp")}
            </button>

            <button className="wallet-content__button blue">{t("payout")}</button>
          </div>
        </div>
      </div>

      <div className="transaction-container">
        <h2>{t("transHistory")}</h2>

        <div className="wallet-clue">
          <img src={lockIcon} alt="Lock Icon" />

          <span>{t("escrowClue")}</span>
        </div>

        <TransactionsList />
      </div>

      <Modal isOpen={isOpenModalTopUp} onClose={() => setIsOpenModalTopUp(false)}>
        <h2 className="wallet-header">{t("topUp")}</h2>

        <div className="specials__options">
          <button
            className={`specials__option ${activeSection === "stars" ? "active" : ""} `}
            onClick={() => handleClickOption("stars")}
          >
            Stars
          </button>

          <button
            className={`specials__option ${activeSection === "ton" ? "active" : ""} `}
            onClick={() => handleClickOption("ton")}
          >
            TON Wallet
          </button>
        </div>

        {activeSection === "stars" &&
          (isInTelegram ? (
            <>
              <input
                type="number"
                value={stars}
                onChange={(e) => {
                  let val = Number(e.target.value)

                  if (isNaN(val) || val < 1) val = 1
                  if (val > 10000) val = 10000

                  setStars(val)
                }}
                inputMode="numeric" // открывает цифровую клавиатуру на мобилках
                placeholder={t("tasksPage.budgetPlaceholder")}
                className="budget-input"
              />

              <button className="wallet-content__button green" onClick={handleTopUpStars}>
                {t("topUpStars")}
              </button>
            </>
          ) : (
            <>
              <span className="stars-not-supported-text">{t("miniWallet.starsNotSupported")}</span>

              <OpenTelegramButton />
            </>
          ))}

        {activeSection === "ton" && <TonWalletConnect />}
      </Modal>

      <Navigation />
    </div>
  )
}

export default Wallet
