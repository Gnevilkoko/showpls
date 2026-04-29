import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { getGoogleMapBaseOptions } from "../../../utils/googleMapBaseOptions"

const centerMap = { lat: 55.74982, lng: 37.623965 }

interface MiniMapGoogleProps {
  address: string
  onCoordinatesChange: (coordinates: { lat: number; lng: number } | null) => void
  /** Подставить адрес из Google (обратное геокодирование при сдвиге карты / прямое — нормализация строки) */
  onAddressChange?: (address: string) => void
  /** Пока пользователь печатает адрес вручную — не затирать строку ответом геокодера при pan карты */
  addressInputFocused?: boolean
  /** Увеличивать на blur инпута: тогда строка адреса геокодится и карта переезжает (без дебаунса при наборе) */
  geocodeApplyTick: number
}

const MiniMapGoogle = memo(
  ({
    address,
    onCoordinatesChange,
    onAddressChange,
    addressInputFocused = false,
    geocodeApplyTick,
  }: MiniMapGoogleProps) => {
  const mapOptions = useMemo(() => getGoogleMapBaseOptions(), [])
  const isLoaded = useGoogleMapLoaded()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [center, setCenter] = useState<{ lat: number; lng: number }>(centerMap)

  const [mapIsFocused, setMapIsFocused] = useState(false)

  /** После setCenter из геокода — не делаем reverse на следующем idle */
  const programmaticMoveRef = useRef(false)
  /** Первый idle после монтирования карты — не подставлять адрес дефолтного центра */
  const initialIdleDoneRef = useRef(false)
  const addressRef = useRef(address)
  addressRef.current = address

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  const onIdle = useCallback(() => {
    if (!map) return
    const c = map.getCenter()
    if (!c) return
    const coords = { lat: c.lat(), lng: c.lng() }
    setCenter(coords)
    onCoordinatesChange(coords)

    if (programmaticMoveRef.current) {
      programmaticMoveRef.current = false
      return
    }

    if (!initialIdleDoneRef.current) {
      initialIdleDoneRef.current = true
      return
    }

    if (!onAddressChange || addressInputFocused) return

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.formatted_address) return
      const formatted = results[0].formatted_address
      onAddressChange(formatted)
    })
  }, [map, onCoordinatesChange, onAddressChange, addressInputFocused])

  // Прямой геокод только после blur (geocodeApplyTick), не при каждом символе
  useEffect(() => {
    if (!map || geocodeApplyTick === 0) return

    const trimmed = addressRef.current.trim()
    if (!trimmed) return

    const geocoder = new google.maps.Geocoder()
    geocoder.geocode({ address: trimmed }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location
        const coords = { lat: loc.lat(), lng: loc.lng() }
        const formatted = results[0].formatted_address ?? trimmed

        if (formatted !== trimmed) {
          onAddressChange?.(formatted)
        }

        programmaticMoveRef.current = true
        setCenter(coords)
        map.setZoom(16)
        map.panTo(coords)
        onCoordinatesChange(coords)
      } else {
        onCoordinatesChange(null)
      }
    })
  }, [map, geocodeApplyTick, onCoordinatesChange, onAddressChange])

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
        onIdle={onIdle}
        options={mapOptions}
      />

      <div className="mini-map__center-marker">
        <img src={pinIcon} alt="Pin Icon" />
      </div>
    </div>
  )
})

export default MiniMapGoogle
