import checkMarkWhiteIcon from "../../../assets/icons/status/check-mark-white.svg"
import lockKeyholeWhiteIcon from "../../../assets/icons/status/lock-keyhole-white.svg"
import starsIcon from "../../../assets/icons/status/stars.svg"
import { useTranslation } from "react-i18next"
import { useFormatDate } from "../../../shared/hooks/useFormatDate"
import { useGetTransactionsQuery } from "../../../store/api/userApi"
import type { TransactionBackend, TransactionTypeBackend } from "../../../shared/types/backend"

/** Масштаб STARS в ledger (минимальные единицы: 1 STAR = 1e6). */
const STARS_SCALE = 1e6

/**
 * Сумма к отображению. Бэкенд может отдавать либо в целых (100, 50),
 * либо в минимальных единицах (100000000). Если значение >= 1e6 — делим на scale.
 */
function formatAmount(amountStr: string, scale: number = STARS_SCALE): number {
  const amount = BigInt(amountStr)
  if (amount < BigInt(scale)) return Number(amount)
  return Number(amount / BigInt(scale))
}

/** Маппинг типа транзакции на ключ i18n и признак "удержание" (иконка замка). Для escrow-hold при списании показываем "оплата заказа". */
function getTransactionDisplay(
  type: TransactionTypeBackend,
  isDebit: boolean
): { i18nKey: string; status: "verified" | "hold" } {
  switch (type) {
    case "create-deposit":
      return { i18nKey: "founded", status: "verified" }
    case "revert-deposit":
      return { i18nKey: "revertDeposit", status: "verified" }
    case "escrow-hold":
      return {
        i18nKey: isDebit ? "escrowHold" : "escrowHoldLocked",
        status: "hold",
      }
    case "escrow-release":
      return { i18nKey: "releasedExecutor", status: "verified" }
    case "escrow-refund":
      return { i18nKey: "refundedCustomer", status: "verified" }
    default:
      return { i18nKey: "founded", status: "verified" }
  }
}

const TransactionsList = () => {
  const { t } = useTranslation()
  const { formatDate } = useFormatDate()

  const { data, isLoading, isError } = useGetTransactionsQuery({ limit: 50, offset: 0 })

  const items = data?.items ?? []

  if (isLoading) {
    return (
      <div className="empty-state" style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
        <p>{t("loading")}</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="empty-state" style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
        <p>{t("errors.errorLoadingTasks", "Не удалось загрузить историю.")}</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty-state" style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
        <p>{t("noTransactions", "У вас пока нет транзакций.")}</p>
      </div>
    )
  }

  return (
    <>
      {items.map((item: TransactionBackend) => {
        const amountBigInt = BigInt(item.amount)
        const isDebit = amountBigInt < 0n
        const amountNum = formatAmount(isDebit ? String(-amountBigInt) : item.amount)
        const { i18nKey, status } = getTransactionDisplay(item.type, isDebit)
        const isStars = item.currency?.code === "STARS" && item.currency?.blockchain == null

        return (
          <div className="transaction_item" key={item.id}>
            <div className={`trans-status-icon ${status === "verified" ? "green" : "gold"}`}>
              <img
                src={status === "verified" ? checkMarkWhiteIcon : lockKeyholeWhiteIcon}
                alt={status === "verified" ? "OK" : "Hold"}
              />
            </div>
            <div className={`transaction_item-content ${isDebit ? "transaction_item-content--debit" : ""}`}>
              <span>
                {isDebit && "−"}
                {t(i18nKey, { count: amountNum })}
              </span>
              {isStars && <img src={starsIcon} alt="Stars" />}
            </div>
            <div className="trans-date">{formatDate(item.createdAt)}</div>
          </div>
        )
      })}
    </>
  )
}

export default TransactionsList
