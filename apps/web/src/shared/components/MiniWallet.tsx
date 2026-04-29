import { useNavigate } from "react-router-dom"
import starsIcon from "../../assets/icons/status/stars.svg"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../../store"
import { useGetBalancesQuery } from "../../store/api/userApi"

const formatBalance = (value: string | number | undefined | null): string => {
  try {
    const balanceStr = value != null ? String(value) : "0"
    const balance = BigInt(balanceStr || "0")
    const whole = balance / BigInt(1e6)
    return whole.toString()
  } catch {
    return "0"
  }
}

const MiniWallet = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const userData = useAppSelector((state) => state.user.userData)

  const { data: balances } = useGetBalancesQuery(
    { id: userData?.id ?? "" },
    { skip: !userData?.id, refetchOnMountOrArgChange: true }
  )

  const starsEntries = balances?.filter((b) => b.token === "STARS" && b.blockchain === null) ?? []
  const starsTotalBalance = starsEntries.reduce((sum, b) => sum + BigInt(b.balance || "0"), BigInt(0)).toString()
  const starsTotalLocked = starsEntries.reduce((sum, b) => sum + BigInt(b.lockedBalance || "0"), BigInt(0)).toString()
  const availableBalance = starsEntries.length ? formatBalance(starsTotalBalance) : "0"
  const lockedBalance = starsEntries.length ? formatBalance(starsTotalLocked) : "0"

  const handleClickWallet = () => {
    navigate("/wallet")
  }

  return (
    <div className="wallet-mini-container" onClick={handleClickWallet}>
      <div className="wallet__header">
        <div className="wallet-content__wrapper">
          <span className="wallet-content__available">{t("miniWallet.availableFunds")}</span>

          <div className="wallet-content">
            <span className="count-stars">{availableBalance}</span>

            <div className="tg-stars-icon__container">
              <img src={starsIcon} alt="Telegram Stars Icon" className="tg-stars-icon" />
            </div>
          </div>
        </div>

        <div className="wallet__stars-status">
          <span className="count-hold-stars">{lockedBalance}</span>

          <img src={starsIcon} alt="Telegram Stars Icon" />

          <span className="stars-status">{t("miniWallet.onHold")}</span>
        </div>
      </div>
    </div>
  )
}

export default MiniWallet
