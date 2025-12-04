import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"
import type { TaskType } from "../../../types"
import { createRoot, type Root } from "react-dom/client"
import starsWhiteIcon from "../../../../assets/icons/status/stars-white.svg"

interface MarkerContentProps {
  count: number
  image: string
}

const MarkerContent = ({ count, image }: MarkerContentProps) => {
  return (
    <div className="custom-marker__content">
      {count}

      <span>
        <img src={image} alt="Stars Icon" />
      </span>
    </div>
  )
}

interface MainMapGoogleProps {
  selectedTask: TaskType | null
  handleSelectTask: (task: TaskType) => void
  tasksList: TaskType[]
}

const centerMap = { lat: 37.75296, lng: -122.467844 }

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: GOOGLE_MAP_ID,
  gestureHandling: "greedy",
}

const MainMapGoogle = memo(({ selectedTask, handleSelectTask, tasksList }: MainMapGoogleProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const isLoaded = useGoogleMapLoaded()
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const rootsRef = useRef<Map<string, Root>>(new Map())

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  // Программное центрирование карты на выбранной задаче при изменении selectedTask
  useEffect(() => {
    if (map && selectedTask) {
      map.panTo(selectedTask.position)
    }
  }, [map, selectedTask])

  // Инициализация маркеров: создание маркеров на карте только при первой загрузке карты
  useEffect(() => {
    if (!map) return

    const initMarkers = async () => {
      // Динамическая загрузка библиотеки маркеров Google Maps (для AdvancedMarkerElement)
      const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
      }
      const { AdvancedMarkerElement } = markerLib

      tasksList.forEach((task) => {
        // Пропускаем создание, если маркер уже существует (избегаем дублирования)
        if (markersRef.current.has(task.id)) return

        // Создаем DOM элемент для контента маркера
        const content = document.createElement("div")
        content.className = `custom-marker ${task.mode === "pro" ? "accent" : ""}`

        // Создаем React root для рендера React компонента внутрь DOM элемента маркера
        const root = createRoot(content)
        root.render(<MarkerContent count={task.price} image={starsWhiteIcon} />)

        // Создаем AdvancedMarkerElement и добавляем на карту
        const marker = new AdvancedMarkerElement({
          map,
          position: task.position,
          content,
        })

        // Добавляем обработчик клика на маркер для выбора задачи
        marker.addListener("click", () => handleSelectTask(task))

        // Сохраняем маркер и root в ref'ы для последующего обновления/удаления
        markersRef.current.set(task.id, marker)
        rootsRef.current.set(task.id, root)
      })
    }

    initMarkers()
  }, [map, tasksList, selectedTask, handleSelectTask])

  if (!isLoaded) return <p>Loading map…</p>

  return (
    <div className="map-wrapper">
      <GoogleMap mapContainerClassName="map" center={centerMap} zoom={14} onLoad={handleLoad} options={mapOptions} />
    </div>
  )
})

export default MainMapGoogle
