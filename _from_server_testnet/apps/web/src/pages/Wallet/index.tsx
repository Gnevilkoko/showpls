import walletIcon from "../../assets/images/wallet-new.svg"
import starsIcon from "../../assets/icons/status/stars.svg"
import lockIcon from "../../assets/icons/status/lock.svg"
import { useTranslation } from "react-i18next"
import { useState, useRef, useCallback, useEffect } from "react"
import { tgService } from "../../services/webApp"
import TonWalletConnect from "./TonWalletConnect"
import Navigation from "../../shared/components/Navigation"
import Modal from "../../shared/components/Modal"
import { useAppSelector } from "../../store"
import { useNotification } from "../../shared/hooks/useNotification"
import TransactionsList from "./components/TransactionsList"
import { TG_SCHEME, TME_LINK } from "../../constants"
import { useGetBalancesQuery, useLazyGetBalancesQuery } from "../../store/api/userApi"

const formatBalance = (value: string | number | undefined | null): string => {
  const balanceStr = value != null ? String(value) : "0"
  const balance = BigInt(balanceStr || "0")
  const whole = balance / BigInt(1e6)
  return whole.toString()
}

const Wallet = () => {
  const { t } = useTranslation()
  const notification = useNotification()

  const [isOpenModalTopUp, setIsOpenModalTopUp] = useState(false)
  const [activeSection, setActiveSection] = useState<"stars" | "ton">("stars")
  const [stars, setStars] = useState<number>(1)
  const [isWaitingPaymentConfirmation, setIsWaitingPaymentConfirmation] = useState(false)
  const userToken = useAppSelector((state) => state.user.accessToken)
  const userData = useAppSelector((state) => state.user.userData)

  // При каждом открытии страницы кошелька и при возврате во вкладку — запрашиваем свежий баланс с сервера
  const { data: balances, isLoading: isBalancesLoading, isError: isBalancesError } = useGetBalancesQuery(
    { id: userData?.id ?? "" },
    {
      skip: !userData?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    }
  )
  const [triggerGetBalances] = useLazyGetBalancesQuery()

  const pollingIntervalRef = useRef<number | null>(null)
  const pollingTimeoutRef = useRef<number | null>(null)

  const starsEntries = balances?.filter((b) => b.token === "STARS" && b.blockchain === null) ?? []
  const starsTotalBalance = starsEntries.reduce((sum, b) => sum + BigInt(b.balance || "0"), BigInt(0)).toString()
  const starsTotalLocked = starsEntries.reduce((sum, b) => sum + BigInt(b.lockedBalance || "0"), BigInt(0)).toString()
  const availableBalance = isBalancesError ? "—" : starsEntries.length ? formatBalance(starsTotalBalance) : "0"
  const lockedBalance = starsEntries.length ? formatBalance(starsTotalLocked) : "0"

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current)
      pollingTimeoutRef.current = null
    }
    setIsWaitingPaymentConfirmation(false)
  }, [])

  const startBalancePolling = useCallback(
    (previousBalance: string) => {
      if (!userData?.id) return

      setIsWaitingPaymentConfirmation(true)

      const POLLING_INTERVAL = 500
      const POLLING_TIMEOUT = 10000

      pollingIntervalRef.current = window.setInterval(async () => {
        try {
          const result = await triggerGetBalances({ id: userData.id }).unwrap()
          const newStarsEntries = result.filter((b) => b.token === "STARS" && b.blockchain === null)
          const newStarsTotal = newStarsEntries.reduce((s, b) => s + BigInt(b.balance || "0"), BigInt(0))

          if (newStarsTotal > BigInt(previousBalance)) {
            stopPolling()
            notification.showSuccess("paymentSuccess")
            setIsOpenModalTopUp(false)
          }
        } catch {
          // Продолжаем polling при ошибке
        }
      }, POLLING_INTERVAL)

      pollingTimeoutRef.current = window.setTimeout(() => {
        stopPolling()
        notification.showWarning("paymentProcessing")
        setIsOpenModalTopUp(false)
      }, POLLING_TIMEOUT)
    },
    [userData?.id, triggerGetBalances, stopPolling, notification]
  )

  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const isInTelegram = window.Telegram?.WebApp?.initData

  const handleClickOption = (val: "stars" | "ton") => {
    setActiveSection(val)
  }

  const handleClickTopUp = () => {
    setIsOpenModalTopUp(true)
  }

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

  const handleTopUpStars = async () => {
    const webApp = tgService.webApp

    if (!webApp || !userToken) {
      return
    }

    try {
      const res = await fetch(`${window.location.origin}/api/stars-top-up/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
        body: JSON.stringify({ amount: stars }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        notification.handleError(
          new Error(errorData.message || t("errors.topUpCreateError")),
          t("errors.topUpCreateError")
        )
        return
      }

      const data = await res.json()

      if (!data.link) {
        notification.showError("invalidServerResponse")
        return
      }

      const currentBalance = starsTotalBalance

      webApp.openInvoice(data.link, (status) => {
        switch (status) {
          case "paid":
            startBalancePolling(currentBalance)
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
    } catch (error) {
      notification.handleError(error, t("errors.topUpCreateError"))
    }
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
            <span className="count-hold-stars">{isBalancesLoading ? "..." : lockedBalance}</span>

            <img src={starsIcon} alt="Telegram Stars Icon" />

            <span className="stars-status">{t("miniWallet.onHold")}</span>
          </div>
        </div>

        <div className="wallet-content__container">
          <div className="wallet-content__wrapper">
            <span className="wallet-content__available">{t("miniWallet.available")}</span>

            <div className="wallet-content">
              <span className="count-stars">{isBalancesLoading ? "..." : availableBalance}</span>

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
          (isWaitingPaymentConfirmation ? (
            <div className="payment-confirmation-waiting">
              <span>{t("miniWallet.waitingConfirmation")}</span>
            </div>
          ) : isInTelegram ? (
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

              <button className="wallet-content__button green" onClick={handleOpenMiniApp}>
                {t("openMiniApp")}
              </button>
            </>
          ))}

        {activeSection === "ton" && <TonWalletConnect />}
      </Modal>

      <Navigation />
    </div>
  )
}

export default Wallet
