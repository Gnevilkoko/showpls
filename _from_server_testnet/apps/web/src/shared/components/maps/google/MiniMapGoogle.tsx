import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { getGoogleMapBaseOptions } from "../../../utils/googleMapBaseOptions"

const centerMap = { lat: 55.74982, lng: 37.623965 }

/** Пауза после последнего движения карты перед обратным геокодом */
const REVERSE_GEOCODE_SETTLE_MS = 1_400
/** Не чаще одного обратного геокода к Google за этот интервал */
const REVERSE_GEOCODE_MIN_INTERVAL_MS = 4_000
/** Игнорировать обратный геокод, если центр почти не сдвинулся */
const REVERSE_GEOCODE_MIN_MOVE_M = 45

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6_371_000
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

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

  const onAddressChangeRef = useRef(onAddressChange)
  onAddressChangeRef.current = onAddressChange
  const addressInputFocusedRef = useRef(addressInputFocused)
  addressInputFocusedRef.current = addressInputFocused

  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastReverseGeocodeAtRef = useRef(0)
  const lastReverseGeocodeCoordsRef = useRef<{ lat: number; lng: number } | null>(null)

  const clearReverseGeocodeTimer = useCallback(() => {
    if (reverseTimerRef.current != null) {
      window.clearTimeout(reverseTimerRef.current)
      reverseTimerRef.current = null
    }
  }, [])

  /**
   * Обратный геокод только после явного жеста (drag / zoom) и паузы:
   * не вызываем на каждом idle (тайлы, ресайз, анимации) — это ломало квоты.
   */
  const scheduleReverseGeocodeAfterUserSettled = useCallback(() => {
    if (!map) return
    if (!onAddressChangeRef.current) return
    if (addressInputFocusedRef.current) return
    if (!initialIdleDoneRef.current) return
    if (programmaticMoveRef.current) return

    clearReverseGeocodeTimer()
    reverseTimerRef.current = window.setTimeout(() => {
      reverseTimerRef.current = null
      if (!map) return
      if (!onAddressChangeRef.current) return
      if (addressInputFocusedRef.current) return
      if (programmaticMoveRef.current) return

      const c = map.getCenter()
      if (!c) return
      const coords = { lat: c.lat(), lng: c.lng() }

      const now = Date.now()
      if (now - lastReverseGeocodeAtRef.current < REVERSE_GEOCODE_MIN_INTERVAL_MS) return

      const prev = lastReverseGeocodeCoordsRef.current
      if (prev != null && haversineMeters(prev, coords) < REVERSE_GEOCODE_MIN_MOVE_M) return

      lastReverseGeocodeAtRef.current = now
      lastReverseGeocodeCoordsRef.current = coords

      const geocoder = new google.maps.Geocoder()
      geocoder.geocode({ location: coords }, (results, status) => {
        if (status !== "OK" || !results?.[0]?.formatted_address) return
        onAddressChangeRef.current?.(results[0].formatted_address)
      })
    }, REVERSE_GEOCODE_SETTLE_MS)
  }, [map, clearReverseGeocodeTimer])

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
    }
  }, [map, onCoordinatesChange])

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
        lastReverseGeocodeCoordsRef.current = coords
        lastReverseGeocodeAtRef.current = Date.now()
        clearReverseGeocodeTimer()
        setCenter(coords)
        map.setZoom(16)
        map.panTo(coords)
        onCoordinatesChange(coords)
      } else {
        onCoordinatesChange(null)
      }
    })
  }, [map, geocodeApplyTick, onCoordinatesChange, onAddressChange, clearReverseGeocodeTimer])

  useEffect(() => () => clearReverseGeocodeTimer(), [clearReverseGeocodeTimer])

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
        onDragEnd={() => {
          if (programmaticMoveRef.current) return
          scheduleReverseGeocodeAfterUserSettled()
        }}
        onZoomChanged={() => {
          if (programmaticMoveRef.current) return
          scheduleReverseGeocodeAfterUserSettled()
        }}
        options={mapOptions}
      />

      <div className="mini-map__center-marker">
        <img src={pinIcon} alt="Pin Icon" />
      </div>
    </div>
  )
})

export default MiniMapGoogle
