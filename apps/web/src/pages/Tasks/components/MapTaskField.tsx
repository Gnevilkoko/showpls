import MiniMapGoogle from "../../../shared/components/maps/google/MiniMapGoogle"
import CustomerBanner from "./CustomerBanner"
import locationIcon from "../../../assets/icons/ui/location.svg"
import { useTranslation } from "react-i18next"
import { useSelector } from "react-redux"
import type { RootState } from "../../../store"
import MiniMap2Gis from "../../../shared/components/maps/2Gis/MiniMap2Gis"

interface MapTaskFieldProps {
  value: string
  onChange: (value: string) => void
  mapCoordinates: { lat: number; lng: number } | null
  setMapCoordinates: (coordinates: { lat: number; lng: number } | null) => void
}

const MapTaskField = ({ value, onChange, mapCoordinates, setMapCoordinates }: MapTaskFieldProps) => {
  const { t } = useTranslation()
  const language = useSelector((state: RootState) => state.language)
  const isRussian = language === "ru"

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

      {isRussian ? (
        <MiniMap2Gis address={value} onCoordinatesChange={setMapCoordinates} />
      ) : (
        <MiniMapGoogle address={value} onCoordinatesChange={setMapCoordinates} />
      )}
    </CustomerBanner>
  )
}

export default MapTaskField
