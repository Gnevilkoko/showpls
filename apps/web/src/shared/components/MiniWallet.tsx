import { useNavigate } from "react-router-dom"
import starsIcon from "../../assets/icons/status/stars.svg"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../../store"
import { useGetBalancesQuery } from "../../store/api/userApi"

const formatBalance = (balanceStr: string): string => {
  try {
    const balance = BigInt(balanceStr)
    const whole = balance / BigInt(1e6)
    return whole.toString()
  } catch (e) {
    return "0";
  }
}

const MiniWallet = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const userData = useAppSelector((state) => state.user.userData)

  const { data: balances } = useGetBalancesQuery(
    { id: userData?.id ?? "" },
    { skip: !userData?.id }
  )

  const starsBalance = balances?.find((b) => b.token === "STARS" && b.blockchain === null)
  const availableBalance = starsBalance ? formatBalance(starsBalance.balance) : "0"
  const lockedBalance = starsBalance ? formatBalance(starsBalance.lockedBalance) : "0"

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
