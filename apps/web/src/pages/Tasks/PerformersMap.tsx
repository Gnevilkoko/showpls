import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useMapLoaded } from "../../shared/providers/MapContext"
import { MAP_ID } from "../../constants"
import type { PerformerType } from "../../shared/types"
import { createRoot, type Root } from "react-dom/client"
import { performersData } from "./performersData"
import statsStarWhiteIcon from "../../assets/icons/status/stats-star-white.svg"
import PerformerItem from "./PerformerItem"

interface MarkerContentProps {
  count: number
  image: string
}

const MarkerContent = ({ count, image }: MarkerContentProps) => {
  return (
    <div className="custom-marker__content">
      {count}
      {count % 1 === 0 && ".0"}
      <span>
        <img src={image} alt="Stars Icon" />
      </span>
    </div>
  )
}

const centerMap = { lat: 37.75296, lng: -122.467844 }

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: MAP_ID,
  gestureHandling: "greedy",
}

const PerformersMap = memo(() => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const isLoaded = useMapLoaded()
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const rootsRef = useRef<Map<string, Root>>(new Map())
  const [selectedPerformer, setSelectedPerformer] = useState<PerformerType | null>(null)
  const mapPerformerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const performersContainerRef = useRef<HTMLDivElement | null>(null)

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  // Программное центрирование карты на выбранном исполнителе при изменении selectedPerformer
  useEffect(() => {
    if (map && selectedPerformer) {
      map.panTo(selectedPerformer.position)
    }
  }, [map, selectedPerformer])

  // Автоматический плавный скролл к выбранному исполнителю в горизонтальном списке
  useEffect(() => {
    if (!selectedPerformer || !performersContainerRef.current) return

    const itemRef = mapPerformerRefs.current[selectedPerformer.id.toString()]
    const container = performersContainerRef.current

    if (!itemRef || !container) return

    const targetScrollLeft = itemRef.offsetLeft - container.clientWidth / 2 + itemRef.offsetWidth / 2
    const startScrollLeft = container.scrollLeft
    const distance = targetScrollLeft - startScrollLeft
    const duration = 500
    let startTime: number | null = null

    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime

      const progress = Math.min((currentTime - startTime) / duration, 1)
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)

      container.scrollLeft = startScrollLeft + distance * ease(progress)

      if (progress < 1) requestAnimationFrame(animateScroll)
    }

    requestAnimationFrame(animateScroll)
  }, [selectedPerformer])

  // Инициализация маркеров: создание маркеров на карте только при первой загрузке карты
  useEffect(() => {
    if (!map) return

    const initMarkers = async () => {
      // Динамическая загрузка библиотеки маркеров Google Maps (для AdvancedMarkerElement)
      const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
      }
      const { AdvancedMarkerElement } = markerLib

      performersData.forEach((performer) => {
        // Пропускаем создание, если маркер уже существует (избегаем дублирования)
        if (markersRef.current.has(performer.id.toString())) return

        // Создаем DOM элемент для контента маркера
        const content = document.createElement("div")
        content.className = `custom-marker ${performer.rating >= 4.5 ? "accent" : ""}`

        // Создаем React root для рендера React компонента внутрь DOM элемента маркера
        const root = createRoot(content)
        root.render(<MarkerContent count={performer.rating} image={statsStarWhiteIcon} />)

        // Создаем AdvancedMarkerElement и добавляем на карту
        const marker = new AdvancedMarkerElement({
          map,
          position: performer.position,
          content,
        })

        // Добавляем обработчик клика на маркер для выбора задачи
        marker.addListener("click", () => setSelectedPerformer(performer))

        // Сохраняем маркер и root в ref'ы для последующего обновления/удаления
        markersRef.current.set(performer.id.toString(), marker)
        rootsRef.current.set(performer.id.toString(), root)
      })
    }

    initMarkers()
  }, [map, selectedPerformer])

  if (!isLoaded) return <p>Loading map…</p>

  return (
    <>
      <div className="map-wrapper">
        <GoogleMap mapContainerClassName="map" center={centerMap} zoom={14} onLoad={handleLoad} options={mapOptions} />
      </div>

      <div className="map-performers-wrapper">
        <div className="map-performers-container" ref={performersContainerRef}>
          {performersData.map((performer) => (
            <PerformerItem
              key={performer.id}
              performer={performer}
              ref={(el: HTMLDivElement | null) => {
                mapPerformerRefs.current[performer.id.toString()] = el
              }}
              handleSelectPerformer={() => setSelectedPerformer(performer)}
            />
          ))}
        </div>
      </div>
    </>
  )
})

export default PerformersMap
