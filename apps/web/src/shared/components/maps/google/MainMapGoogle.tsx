import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"
import type { TaskType } from "../../../types"
import { createRoot, type Root } from "react-dom/client"
import { MarkerClusterer } from "@googlemaps/markerclusterer"
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
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number } | null) => void
}

const centerMap = { lat: 55.74982, lng: 37.623965 }

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: GOOGLE_MAP_ID,
  gestureHandling: "greedy",
}

const MainMapGoogle = memo(({ selectedTask, handleSelectTask, tasksList, onBoundsChange }: MainMapGoogleProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const isLoaded = useGoogleMapLoaded()
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const rootsRef = useRef<Map<string, Root>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  // Функция для получения bounds карты
  const getBounds = useCallback((): { north: number; south: number; east: number; west: number } | null => {
    if (!map) return null

    const bounds = map.getBounds()
    if (!bounds) return null

    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()

    return {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    }
  }, [map])

  // Обработчик изменения bounds карты (zoom, pan, drag) с debounce
  useEffect(() => {
    if (!map || !onBoundsChange) return

    // Debounce для оптимизации (500ms)
    let debounceTimer: number | null = null
    const DEBOUNCE_DELAY = 500

    const updateBounds = () => {
      // Очищаем предыдущий таймер
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer)
      }

      // Устанавливаем новый таймер
      debounceTimer = window.setTimeout(() => {
        const bounds = getBounds()
        if (bounds) {
          onBoundsChange(bounds)
        }
        debounceTimer = null
      }, DEBOUNCE_DELAY)
    }

    // Слушаем события изменения карты
    // Используем только события окончания действий для оптимизации
    const listeners = [
      map.addListener("bounds_changed", updateBounds),
      map.addListener("dragend", updateBounds),
      map.addListener("zoom_changed", updateBounds),
    ]

    // Первоначальное получение bounds
    const initialBounds = getBounds()
    if (initialBounds) {
      onBoundsChange(initialBounds)
    }

    return () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer)
      }
      listeners.forEach((listener) => {
        google.maps.event.removeListener(listener)
      })
    }
  }, [map, onBoundsChange, getBounds])

  // Программное центрирование карты на выбранной задаче при изменении selectedTask
  useEffect(() => {
    if (map && selectedTask) {
      map.panTo(selectedTask.position)
    }
  }, [map, selectedTask])

  // Ref для хранения предыдущего списка ID задач (для оптимизации)
  const previousTaskIdsRef = useRef<Set<string>>(new Set())

  // Обновление маркеров при изменении tasksList с кластеризацией
  useEffect(() => {
    if (!map) return

    const updateMarkers = async () => {
      // Динамическая загрузка библиотеки маркеров Google Maps (для AdvancedMarkerElement)
      const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
      }
      const { AdvancedMarkerElement } = markerLib

      // Получаем множество ID текущих задач
      const currentTaskIds = new Set(tasksList.map((task) => task.id))

      // Проверяем, изменился ли список задач (сравниваем по ID)
      const previousTaskIds = previousTaskIdsRef.current
      const taskIdsChanged =
        currentTaskIds.size !== previousTaskIds.size || ![...currentTaskIds].every((id) => previousTaskIds.has(id))

      // Если список задач не изменился, не обновляем кластер
      if (!taskIdsChanged && clustererRef.current) {
        return
      }

      // Обновляем ref с текущими ID
      previousTaskIdsRef.current = currentTaskIds

      // Удаляем старый кластер, если он существует
      if (clustererRef.current) {
        clustererRef.current.clearMarkers()
        clustererRef.current = null
      }

      // Удаляем маркеры, которых нет в новом списке
      for (const [taskId, marker] of markersRef.current.entries()) {
        if (!currentTaskIds.has(taskId)) {
          marker.map = null
          const root = rootsRef.current.get(taskId)
          if (root) {
            root.unmount()
          }
          markersRef.current.delete(taskId)
          rootsRef.current.delete(taskId)
        }
      }

      // Создаем или обновляем маркеры для задач
      const markers: google.maps.marker.AdvancedMarkerElement[] = []

      tasksList.forEach((task) => {
        // Если маркер уже существует, используем его
        if (markersRef.current.has(task.id)) {
          markers.push(markersRef.current.get(task.id)!)
          return
        }

        // Создаем новый маркер
        const content = document.createElement("div")
        content.className = `custom-marker ${task.mode === "pro" ? "accent" : ""}`

        const root = createRoot(content)
        root.render(<MarkerContent count={Number(task.price)} image={starsWhiteIcon} />)

        const marker = new AdvancedMarkerElement({
          map,
          position: task.position,
          content,
        })

        marker.addListener("click", () => handleSelectTask(task))

        markersRef.current.set(task.id, marker)
        rootsRef.current.set(task.id, root)
        markers.push(marker)
      })

      // Создаем новый кластер с маркерами (только если список задач изменился)
      if (markers.length > 0) {
        clustererRef.current = new MarkerClusterer({
          map,
          markers,
          renderer: {
            render: ({ count, position }) => {
              const clusterElement = document.createElement("div")
              clusterElement.className = "cluster"
              clusterElement.textContent = count.toString()

              const clusterMarker = new AdvancedMarkerElement({
                position,
                content: clusterElement,
                map,
              })

              return clusterMarker
            },
          },
        })
      }
    }

    updateMarkers()
  }, [map, tasksList, handleSelectTask])

  if (!isLoaded) return <p>Loading map…</p>

  return (
    <div className="map-wrapper">
      <GoogleMap mapContainerClassName="map" center={centerMap} zoom={14} onLoad={handleLoad} options={mapOptions} />
    </div>
  )
})

export default MainMapGoogle
