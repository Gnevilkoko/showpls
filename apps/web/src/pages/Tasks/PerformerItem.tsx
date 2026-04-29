import type { PerformerType } from "../../shared/types"
import userIcon from "../../assets/icons/navigation/user.svg"
import { useTranslation } from "react-i18next"
import { formatTimeFromEpochMs } from "../../shared/format"
import statsStarWhiteIcon from "../../assets/icons/status/stats-star-white.svg"
import TaskPrimaryButton from "../../shared/components/TaskPrimaryButton"
import penWhiteIcon from "../../assets/icons/actions/pen-white.svg"

interface PerformerItemProps {
  performer: PerformerType
  ref: (el: HTMLDivElement | null) => void
  handleSelectPerformer: (performer: PerformerType) => void
}

const PerformerItem = ({ performer, ref, handleSelectPerformer }: PerformerItemProps) => {
  const { t } = useTranslation()

  const lastOnline = formatTimeFromEpochMs(performer.lastSeenAt.getTime())

  return (
    <div className="performer-item__wrapper" ref={ref} onClick={() => handleSelectPerformer(performer)}>
      <div className="performer-item__user-info-wrapper">
        <div className="performer-item__title">
          <img src={performer.avatar || userIcon} alt="Performer Avatar" className="performer-item__avatar" />

          <div className="performer-item__user-info">
            <span className="performer-item__name-user">
              {performer.firstName} {performer.lastName && performer.lastName}
            </span>

            <span className="performer-item__online-status">{lastOnline}</span>
          </div>
        </div>

        <div className={`performer-item__rating ${performer.rating >= 4.5 ? "accent" : ""}`}>
          {performer.rating}
          {performer.rating % 1 === 0 && ".0"}

          <img src={statsStarWhiteIcon} alt="Star Icon" />
        </div>
      </div>

      <TaskPrimaryButton color="green" onClick={() => {}} icon={penWhiteIcon} text={t("sendTheOrder")} />
    </div>
  )
}

export default PerformerItem
