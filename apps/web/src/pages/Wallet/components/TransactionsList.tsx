import type { TransactionType } from "../../../shared/types"
import { walletTransactionList } from "../data/transactionList"
import checkMarkWhiteIcon from "../../../assets/icons/status/check-mark-white.svg"
import lockKeyholeWhiteIcon from "../../../assets/icons/status/lock-keyhole-white.svg"
import starsIcon from "../../../assets/icons/status/stars.svg"
import { useTranslation } from "react-i18next"
import { useFormatDate } from "../../../shared/hooks/useFormatDate"

const TransactionsList = () => {
  const { t } = useTranslation()

  const { formatDate } = useFormatDate()

  return (
    <>
      {walletTransactionList.map((item: TransactionType) => (
        <div className="transaction_item" key={item.id}>
          <div className={`trans-status-icon ${item.status === "verified" ? "green" : "gold"}`}>
            <img src={item.status === "verified" ? checkMarkWhiteIcon : lockKeyholeWhiteIcon} alt="Check Mark Icon" />
          </div>

          <div className="transaction_item-content">
            <span>{t(item.type, { count: item.stars })}</span>

            {item.isStars && <img src={starsIcon} alt="Telegram Stars Icon" />}
          </div>

          <div className="trans-date">{formatDate(item.date)}</div>
        </div>
      ))}
    </>
  )
}

export default TransactionsList
