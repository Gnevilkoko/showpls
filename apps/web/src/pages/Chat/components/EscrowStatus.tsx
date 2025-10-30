import type { ChatOrderType } from "../../../shared/types"
import lockBlueIcon from "../../../assets/icons/status/lock-blue.svg"
import starsIcon from "../../../assets/icons/status/stars.svg"
import verifiedCheckIcon from "../../../assets/icons/status/verified-check.svg"
import closeRedIcon from "../../../assets/icons/ui/close-icon-red.svg"
import { useTranslation } from "react-i18next"

interface EscrowStatusProps {
  selectedOrder: ChatOrderType | undefined
}

const EscrowStatus = ({ selectedOrder }: EscrowStatusProps) => {
  const { t } = useTranslation()

  if (!selectedOrder?.escrowStatus) return null

  let className = ""
  let iconSrc = ""
  let statusText = ""

  switch (selectedOrder.escrowStatus) {
    case "locked":
      className = "blue"
      iconSrc = lockBlueIcon
      statusText = t("lockedInEscrow")
      break
    case "released":
      className = "green"
      iconSrc = verifiedCheckIcon
      statusText = t("releasedFromEscrow")
      break
    case "rejected":
      className = "red"
      iconSrc = closeRedIcon
      statusText = t("rejectedFromEscrow")
      break
  }

  return (
    <div className="chats__escrow-status-wrapper">
      <div className={`chats__escrow-status ${className}`}>
        <img src={iconSrc} alt="Status Icon" />

        <span>
          {t("payment", { count: selectedOrder?.order.price })}
          <img src={starsIcon} alt="Stars Icon" />
          {statusText}
        </span>
      </div>
    </div>
  )
}

export default EscrowStatus
