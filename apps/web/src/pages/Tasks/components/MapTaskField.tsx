import MiniMapContainer from "../MiniMapContainer"
import CustomerBanner from "./CustomerBanner"
import locationIcon from "../../../assets/icons/ui/location.svg"
import { useTranslation } from "react-i18next"

interface MapTaskFieldProps {
  value: string
  onChange: (value: string) => void
  mapCoordinates: { lat: number; lng: number } | null
  setMapCoordinates: (coordinates: { lat: number; lng: number } | null) => void
}

const MapTaskField = ({ value, onChange, mapCoordinates, setMapCoordinates }: MapTaskFieldProps) => {
  const { t } = useTranslation()

  return (
    <CustomerBanner icon={locationIcon} title={t("tasksPage.location")} isValid={mapCoordinates !== null}>
      <input
        type="text"
        className="input-location"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("tasksPage.locationPlaceholder")}
      />

      <p className="customer-banner__paragraph">{t("tasksPage.orMarkMap")}</p>

      <MiniMapContainer address={value} onCoordinatesChange={setMapCoordinates} />
    </CustomerBanner>
  )
}

export default MapTaskField
