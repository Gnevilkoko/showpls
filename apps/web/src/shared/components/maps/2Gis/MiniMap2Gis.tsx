import { load } from "@2gis/mapgl"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg"
import { API_KEY_2GIS, STYLE_DARK_2GIS, STYLE_LIGHT_2GIS } from "../../../../constants"
import { useAppSelector, type RootState } from "../../../../store"

// лишь демонстрация, сюда возможно пойдет реальная геолокация пользователя
// Для 2ГИС нужно инвертировать координаты: сначала lng, потом lat
const centerMap: [number, number] = [37.623965, 55.74982]

interface MiniMap2GisProps {
  address: string // строка из инпута
  onCoordinatesChange: (coordinates: { lat: number; lng: number } | null) => void
}

const MiniMap2Gis = memo(({ address, onCoordinatesChange }: MiniMap2GisProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapglAPIRef = useRef<any>(null)
  const isMapInitializedRef = useRef(false)
  const isMapReadyRef = useRef(false)
  const [center, setCenter] = useState<[number, number]>(centerMap)
  const [mapIsFocused, setMapIsFocused] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const theme = useAppSelector((state: RootState) => state.theme)
  // Меняем тему на лету
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyleById(theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS)
    }
  }, [theme])

  // Получение координат центра карты
  const handleGetCoords = useCallback(() => {
    if (!mapRef.current || !isMapReadyRef.current) return

    const centerCoords = mapRef.current.getCenter()
    if (!centerCoords) return

    // Для 2ГИС координаты в формате [lng, lat], конвертируем в { lat, lng }
    const coords = { lat: centerCoords[1], lng: centerCoords[0] }
    onCoordinatesChange(coords)
  }, [onCoordinatesChange])

  // Геокодирование адреса через 2GIS Geocoder API
  const geocodeAddress = useCallback(
    async (addressQuery: string) => {
      try {
        // Используем правильный endpoint для геокодирования 2GIS Catalog API
        const response = await fetch(
          `https://catalog.api.2gis.com/3.0/items/geocode?q=${encodeURIComponent(
            addressQuery
          )}&key=${API_KEY_2GIS}&fields=items.point&page_size=1`
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("Geocoding API error:", response.status, errorData)
          onCoordinatesChange(null)
          return
        }

        const data = await response.json()

        if (data.result?.items?.[0]?.point) {
          const point = data.result.items[0].point
          // 2GIS возвращает координаты в формате [lng, lat]
          const coords: [number, number] = [point.lon, point.lat]
          setCenter(coords)
          if (mapRef.current) {
            mapRef.current.setCenter(coords)
            mapRef.current.setZoom(16)
          }
          // Конвертируем в формат { lat, lng } для колбэка
          onCoordinatesChange({ lat: point.lat, lng: point.lon })
        } else {
          onCoordinatesChange(null)
        }
      } catch (error) {
        console.error("Geocoding error:", error)
        onCoordinatesChange(null)
      }
    },
    [onCoordinatesChange]
  )

  // Когда изменился адрес — геокодируем и двигаем карту
  useEffect(() => {
    if (!address) return

    const debounce = setTimeout(() => {
      geocodeAddress(address)
    }, 1000)

    return () => clearTimeout(debounce)
  }, [address, geocodeAddress])

  // Инициализация карты - только один раз
  useEffect(() => {
    if (isMapInitializedRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    load().then((mapglAPI) => {
      if (isMapInitializedRef.current) return

      mapglAPIRef.current = mapglAPI

      mapInstance = new mapglAPI.Map("miniMap2Gis", {
        center,
        zoom: 14,
        key: API_KEY_2GIS,
        zoomControl: false,
        loopWorld: true,
        style: theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS,
      })

      mapRef.current = mapInstance
      isMapInitializedRef.current = true

      // Ждём готовности карты
      mapInstance.once("idle", () => {
        isMapReadyRef.current = true
        handleGetCoords()
      })

      // Обработчик движения карты для получения координат
      mapInstance.on("moveend", handleGetCoords)
    })

    return () => {
      if (mapInstance) {
        mapInstance.off("moveend", handleGetCoords)
        mapInstance.destroy()
        isMapInitializedRef.current = false
        isMapReadyRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Обновление центра карты при изменении center state
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return

    if (mapRef.current.easeTo) {
      mapRef.current.easeTo({ center })
    } else if (mapRef.current.setCenter) {
      mapRef.current.setCenter(center)
    }
  }, [center])

  // Обновляем размер карты при изменении фокуса (после завершения CSS transition)
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current) return

    // Ждем завершения CSS transition (0.3s из стилей) перед вызовом resize
    const timeoutId = setTimeout(() => {
      mapRef.current.invalidateSize()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [mapIsFocused])

  const handlePointerUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setMapIsFocused(false)
      timeoutRef.current = null
    }, 3000)
  }

  return (
    <div
      className={`mini-map-wrapper ${mapIsFocused ? "focus" : ""}`}
      onPointerDown={() => setMapIsFocused(true)}
      onPointerUp={handlePointerUp}
    >
      <div id="miniMap2Gis" className="mini-map"></div>

      {/* фиксированная иконка по центру карты */}
      <div className="mini-map__center-marker">
        <img src={pinIcon} alt="Pin Icon" />
      </div>
    </div>
  )
})

export default MiniMap2Gis
