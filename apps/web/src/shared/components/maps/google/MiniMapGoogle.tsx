import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg" // своя иконка
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"

// лишь демонстрация, сюда возможно пойдет реальная геолокация пользователя
const centerMap = { lat: 55.74982, lng: 37.623965 }

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: GOOGLE_MAP_ID,
  gestureHandling: "greedy",
}

interface MiniMapGoogleProps {
  address: string // строка из инпута
  onCoordinatesChange: (coordinates: { lat: number; lng: number } | null) => void
}

const MiniMapGoogle = memo(({ address, onCoordinatesChange }: MiniMapGoogleProps) => {
  const isLoaded = useGoogleMapLoaded()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number }>(centerMap)

  const [mapIsFocused, setMapIsFocused] = useState(false)

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  const handleGetCoords = () => {
    if (!map) return

    const center = map.getCenter()
    if (!center) return

    const coords = { lat: center.lat(), lng: center.lng() }
    onCoordinatesChange(coords)
  }

  // Когда изменился адрес — геокодируем и двигаем карту
  useEffect(() => {
    if (!map || !address) return

    const debounce = setTimeout(() => {
      const geocoder = new google.maps.Geocoder()

      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location
          const coords = { lat: loc.lat(), lng: loc.lng() }
          setCenter(coords)
          map.setZoom(16)
          onCoordinatesChange(coords)
        } else {
          onCoordinatesChange(null)
        }
      })
    }, 1000)

    return () => clearTimeout(debounce)
  }, [address, map, onCoordinatesChange])

  const timeoutRef = useRef<number | null>(null)

  const handlePointerUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setMapIsFocused(false)
      timeoutRef.current = null
    }, 3000)
  }

  if (!isLoaded) return <p>Loading map…</p>

  return (
    <div
      className={`mini-map-wrapper ${mapIsFocused ? "focus" : ""}`}
      onPointerDown={() => setMapIsFocused(true)}
      onPointerUp={handlePointerUp}
    >
      <GoogleMap
        mapContainerClassName="mini-map"
        center={center}
        zoom={14}
        onLoad={handleLoad}
        onIdle={handleGetCoords}
        options={mapOptions}
      />

      {/* фиксированная иконка по центру карты */}
      <div className="mini-map__center-marker">
        <img src={pinIcon} alt="Pin Icon" />
      </div>
    </div>
  )
})

export default MiniMapGoogle
