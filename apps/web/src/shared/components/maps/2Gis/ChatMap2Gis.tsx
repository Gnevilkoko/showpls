import { load } from "@2gis/mapgl"
import { memo, useEffect, useRef, useState, useCallback } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg"
import { API_KEY_2GIS, STYLE_DARK_2GIS, STYLE_LIGHT_2GIS } from "../../../../constants"
import { Clusterer } from "@2gis/mapgl-clusterer"
import { useAppSelector, type RootState } from "../../../../store"

interface ChatMap2GisProps {
  coordinates: { lat: number; lng: number }
}

const ChatMap2Gis = memo(({ coordinates }: ChatMap2GisProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapglAPIRef = useRef<any>(null)
  const isMapInitializedRef = useRef(false)
  const isMapReadyRef = useRef(false)
  const [mapIsFocused, setMapIsFocused] = useState(false)
  const [mapLoadError, setMapLoadError] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  const theme = useAppSelector((state: RootState) => state.theme)
  // Меняем тему на лету
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyleById(theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS)
    }
  }, [theme])

  // Создание HTML маркера для одной точки
  const createMarker = useCallback((coords: { lat: number; lng: number }) => {
    return [
      {
        type: "html" as const,
        coordinates: [coords.lng, coords.lat],
        html: `<div class="chat-map__marker map2gis-marker">
            <img src="${pinIcon}" alt="Pin Icon" />
          </div>`,
      },
    ]
  }, [])

  // Создание кластера для одного маркера
  const createClusterer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstance: any, markers: any[]) => {
      const clustererInstance = new Clusterer(mapInstance, {
        radius: 0, // Отключаем кластеризацию для одного маркера
        clusterStyle: () => {
          return {
            type: "html" as const,
            html: `<div></div>`, // Пустой кластер (не должен появляться)
          }
        },
      })

      clustererInstance.load(markers)
      return clustererInstance
    },
    []
  )

  // Инициализация карты - только один раз
  useEffect(() => {
    if (isMapInitializedRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    load()
      .then((mapglAPI) => {
        if (isMapInitializedRef.current) return

        mapglAPIRef.current = mapglAPI

        const center = [coordinates.lng, coordinates.lat]

        try {
          mapInstance = new mapglAPI.Map("chatMap2Gis", {
            center,
            zoom: 16,
            key: API_KEY_2GIS,
            zoomControl: false,
            loopWorld: true,
            style: theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS,
          })
        } catch {
          setMapLoadError(true)
          return
        }

        mapRef.current = mapInstance
        isMapInitializedRef.current = true

        mapInstance.once("idle", () => {
          isMapReadyRef.current = true
          if (coordinates) {
            const markers = createMarker(coordinates)
            clustererRef.current = createClusterer(mapInstance, markers)
          }
        })

        mapInstance.once("error", () => {
          setMapLoadError(true)
        })
      })
      .catch(() => {
        setMapLoadError(true)
      })

    return () => {
      if (clustererRef.current) {
        clustererRef.current.destroy()
        clustererRef.current = null
      }
      if (mapInstance) {
        mapInstance.destroy()
        isMapInitializedRef.current = false
        isMapReadyRef.current = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Обновляем маркер и центрируем карту при изменении координат
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current || !coordinates) return

    // Для 2ГИС нужно инвертировать координаты: сначала lng, потом lat
    const markerCoordinates = [coordinates.lng, coordinates.lat]

    // Удаляем предыдущий кластер если есть
    if (clustererRef.current) {
      clustererRef.current.destroy()
      clustererRef.current = null
    }

    // Создаем новый маркер через кластер
    const markers = createMarker(coordinates)
    clustererRef.current = createClusterer(mapRef.current, markers)

    // Центрируем карту на координатах
    if (mapRef.current.easeTo) {
      mapRef.current.easeTo({ center: markerCoordinates })
    } else if (mapRef.current.setCenter) {
      mapRef.current.setCenter(markerCoordinates)
    }
  }, [coordinates, createMarker, createClusterer])

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

  if (mapLoadError) {
    const { lat, lng } = coordinates
    const mapLink2GIS = `https://2gis.ru/geo/${lng}%2C${lat}`
    return (
      <div className="chat-map-wrapper chat-map-wrapper--unavailable">
        <div className="chat-map-unavailable__icon" aria-hidden>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
        <p className="chat-map-unavailable__text">Открыть локацию в картах</p>
        <a
          href={mapLink2GIS}
          target="_blank"
          rel="noopener noreferrer"
          className="chat-map-unavailable__btn"
        >
          2GIS
        </a>
      </div>
    )
  }

  return (
    <div
      className={`chat-map-wrapper ${mapIsFocused ? "focus" : ""}`}
      onPointerDown={() => setMapIsFocused(true)}
      onPointerUp={handlePointerUp}
    >
      <div id="chatMap2Gis" className="chat-map"></div>
    </div>
  )
})

export default ChatMap2Gis
