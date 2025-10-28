import { useTranslation } from "react-i18next"
import CustomerBanner from "./CustomerBanner"
import clockIcon from "../../../assets/icons/ui/clock.svg"
import TimeSelector from "./TimeSelector"

interface TimeLimitFieldProps {
  isUrgent: boolean
  setIsUrgent: (urgent: boolean) => void
  timeHours: string
  timeMinutes: string
  setTimeHours: (hour: string) => void
  setTimeMinutes: (minute: string) => void
}

const TimeLimitField = ({
  isUrgent,
  setIsUrgent,
  timeHours,
  timeMinutes,
  setTimeHours,
  setTimeMinutes,
}: TimeLimitFieldProps) => {
  const { t } = useTranslation()

  const hoursOptions = Array.from({ length: 24 }, (_, i) => i)
  const minutesOptions = Array.from({ length: 6 }, (_, i) => i * 10)

  const isValidTime =
    !isUrgent ||
    (timeHours.trim().length > 0 && timeMinutes.trim().length > 0 && !(timeHours === "0" && timeMinutes === "0"))

  return (
    <CustomerBanner icon={clockIcon} title={t("tasksPage.timeLimit")} isValid={isValidTime}>
      {isUrgent && (
        <div className="time-selectors">
          <TimeSelector
            value={timeHours}
            setValue={setTimeHours}
            options={hoursOptions}
            placeholder={t("tasksPage.hours")}
          />

          <div className="time-separator">:</div>

          <TimeSelector
            value={timeMinutes}
            setValue={setTimeMinutes}
            options={minutesOptions}
            placeholder={t("tasksPage.minutes")}
          />
        </div>
      )}

      <div className="customer-banner__description-container">
        <div className="customer-banner__description">
          <span className="description__title">{t("tasksPage.urgent")}</span>

          <span>{t("tasksPage.urgentDescription")}</span>
        </div>

        <div>
          <label className="toggle-switch-urgent">
            <input type="checkbox" checked={isUrgent} onChange={() => setIsUrgent(!isUrgent)} />
            <span className="slider" />
          </label>
        </div>
      </div>
    </CustomerBanner>
  )
}

export default TimeLimitField
