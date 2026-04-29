import { useState } from "react"
import MiniMapGoogle from "../../../shared/components/maps/google/MiniMapGoogle"
import CustomerBanner from "./CustomerBanner"
import locationIcon from "../../../assets/icons/ui/location.svg"
import { useTranslation } from "react-i18next"

interface MapTaskFieldProps {
  value: string
  onChange: (value: string) => void
  setMapCoordinates: (coordinates: { lat: number; lng: number } | null) => void
  isValid: boolean
  warningFieldsFlag: boolean
}

const MapTaskField = ({ value, onChange, setMapCoordinates, isValid, warningFieldsFlag }: MapTaskFieldProps) => {
  const { t } = useTranslation()
  const [addressFocused, setAddressFocused] = useState(false)
  const [geocodeApplyTick, setGeocodeApplyTick] = useState(0)

  return (
    <CustomerBanner icon={locationIcon} title={t("tasksPage.location")} isValid={isValid}>
      <input
        type="text"
        className={`input-location ${warningFieldsFlag && !isValid ? "warning" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setAddressFocused(true)}
        onBlur={() => {
          setAddressFocused(false)
          setGeocodeApplyTick((n) => n + 1)
        }}
        placeholder={t("tasksPage.locationPlaceholder")}
        autoComplete="street-address"
      />

      <p className="customer-banner__paragraph">{t("tasksPage.orMarkMap")}</p>

      <MiniMapGoogle
        address={value}
        onCoordinatesChange={setMapCoordinates}
        onAddressChange={onChange}
        addressInputFocused={addressFocused}
        geocodeApplyTick={geocodeApplyTick}
      />
    </CustomerBanner>
  )
}

export default MapTaskField
