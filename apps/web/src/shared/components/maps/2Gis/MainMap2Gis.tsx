import { load } from "@2gis/mapgl"
import { memo, useEffect, useRef, useCallback } from "react"
import { Clusterer } from "@2gis/mapgl-clusterer"
import { API_KEY_2GIS, STYLE_DARK_2GIS, STYLE_LIGHT_2GIS } from "../../../../constants"
import type { TaskType } from "../../../types"
import starsWhiteIcon from "../../../../assets/icons/status/stars-white.svg"
import { useAppSelector, type RootState } from "../../../../store"

interface MapContainerProps {
  selectedTask: TaskType | null
  handleSelectTask: (task: TaskType) => void
  tasksList: TaskType[]
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number } | null) => void
}

// Центр карты Москвы, для 2ГИС нужно
// инвертировать гугловские координаты, сначала lng, потом lat
const centerMap = [37.623965, 55.74982]

const MainMap2Gis = memo(({ selectedTask, handleSelectTask, tasksList, onBoundsChange }: MapContainerProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null)
  const isMapInitializedRef = useRef(false)
  const isMapReadyRef = useRef(false)

  // Функция для получения bounds карты (оптимизированная)
  const getBounds = useCallback((): { north: number; south: number; east: number; west: number } | null => {
    if (!mapRef.current || !isMapReadyRef.current) {
      return null
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapInstance: any = mapRef.current

      // 2GIS mapgl API возвращает bounds через getBounds()
      if (typeof mapInstance.getBounds !== "function") {
        return null
      }

      const bounds = mapInstance.getBounds()
      if (!bounds) {
        return null
      }

      // 2GIS возвращает объект с northEast и southWest (массивы [lng, lat])
      if ("northEast" in bounds && "southWest" in bounds) {
        const ne = bounds.northEast
        const sw = bounds.southWest

        // Проверяем, что это массивы
        if (!Array.isArray(ne) || !Array.isArray(sw) || ne.length < 2 || sw.length < 2) {
          return null
        }

        return {
          north: ne[1], // lat из northEast
          south: sw[1], // lat из southWest
          east: ne[0], // lng из northEast
          west: sw[0], // lng из southWest
        }
      }

      return null
    } catch (error) {
      console.error("Error getting bounds from 2GIS map:", error)
      return null
    }
  }, [])

  // Ref для хранения функции очистки событий
  const cleanupEventsRef = useRef<(() => void) | null>(null)

  const theme = useAppSelector((state: RootState) => state.theme)
  // Меняем тему на лету
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyleById(theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS)
    }
  }, [theme])

  // Создание маркеров из списка задач
  const createMarkers = useCallback((tasks: TaskType[]) => {
    return tasks.map((task) => ({
      type: "html" as const,
      coordinates: [task.position.lng, task.position.lat],
      html: `<div class="custom-marker map2gis-marker ${task.mode === "pro" ? "accent" : ""}">
          <div class="custom-marker__content">
            ${Number(task.price)}
            <span><img src="${starsWhiteIcon}" /></span>
          </div>
        </div>`,
      task: task,
    }))
  }, [])

  // Создание кластера с обработчиком клика
  const createClusterer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstance: any, markers: any[]) => {
      const clustererInstance = new Clusterer(mapInstance, {
        radius: 60,
        clusterStyle: (count: number) => {
          return {
            type: "html" as const,
            html: `<div class="cluster map2gis">${count}</div>`,
          }
        },
      })

      clustererInstance.load(markers)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clustererInstance.on("click", (event: any) => {
        // Клик по кластеру - приближаем карту к меткам в кластере
        if (event.target.type === "cluster" && event.target.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const clusterMarkers: any[] = event.target.data

          if (clusterMarkers && Array.isArray(clusterMarkers) && clusterMarkers.length > 0) {
            // Получаем координаты всех маркеров в кластере
            const coordinates = clusterMarkers
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((marker: any) => marker.coordinates)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((coords: any) => coords && Array.isArray(coords) && coords.length >= 2)

            if (coordinates.length > 0) {
              // Вычисляем центр области (среднее значение координат)
              const lngs = coordinates.map((coords: number[]) => coords[0])
              const lats = coordinates.map((coords: number[]) => coords[1])

              const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2
              const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2

              // Приближаем карту к кластеру
              if (mapInstance.setCenter && mapInstance.setZoom) {
                mapInstance.setCenter([centerLng, centerLat])
                mapInstance.setZoom(18)
              }
            }
          }
        }
        // Клик по отдельному маркеру - открываем задачу
        else if (event.target.type === "marker" && event.target.data?.task) {
          handleSelectTask(event.target.data.task)
        }
      })

      return clustererInstance
    },
    [handleSelectTask]
  )

  // Инициализация карты - только один раз
  useEffect(() => {
    if (isMapInitializedRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    load().then((mapglAPI) => {
      if (isMapInitializedRef.current) return

      mapInstance = new mapglAPI.Map("map2Gis", {
        center: centerMap,
        zoom: 14,
        key: API_KEY_2GIS,
        zoomControl: false,
        loopWorld: true,
        style: theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS,
      })

      mapRef.current = mapInstance
      isMapInitializedRef.current = true

      // Ждём готовности карты перед созданием маркеров
      mapInstance.once("idle", () => {
        isMapReadyRef.current = true

        // Создаём маркеры после готовности карты
        if (tasksList.length) {
          const markers = createMarkers(tasksList)
          clustererRef.current = createClusterer(mapInstance, markers)
        }

        // Подключаем события изменения карты ПОСЛЕ того, как карта готова
        if (onBoundsChange && mapInstance.on) {
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

          // Подключаем только события окончания движения/зума (не во время движения)
          // Это предотвращает избыточные вызовы
          mapInstance.on("moveend", updateBounds)
          mapInstance.on("zoomend", updateBounds)

          // Сохраняем функцию очистки
          cleanupEventsRef.current = () => {
            if (debounceTimer !== null) {
              clearTimeout(debounceTimer)
              debounceTimer = null
            }
            if (mapInstance.off) {
              mapInstance.off("moveend", updateBounds)
              mapInstance.off("zoomend", updateBounds)
            }
          }

          // Первоначальное получение bounds (с небольшой задержкой для стабильности)
          setTimeout(() => {
            const initialBounds = getBounds()
            if (initialBounds) {
              onBoundsChange(initialBounds)
            }
          }, 300)
        }
      })
    })

    return () => {
      // Очищаем события
      if (cleanupEventsRef.current) {
        cleanupEventsRef.current()
        cleanupEventsRef.current = null
      }

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

  // Обновление маркеров при изменении tasksList
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current || !tasksList.length) return

    // Удаляем старый кластер
    if (clustererRef.current) {
      clustererRef.current.destroy()
      clustererRef.current = null
    }

    const markers = createMarkers(tasksList)
    clustererRef.current = createClusterer(mapRef.current, markers)
  }, [tasksList, createMarkers, createClusterer])

  // Программное центрирование карты на выбранной задаче
  useEffect(() => {
    if (!mapRef.current || !isMapReadyRef.current || !selectedTask?.position) return

    const coordinates = [selectedTask.position.lng, selectedTask.position.lat]
    if (mapRef.current.easeTo) {
      mapRef.current.easeTo({ center: coordinates })
    } else if (mapRef.current.setCenter) {
      mapRef.current.setCenter(coordinates)
    }
  }, [selectedTask])

  return (
    <div className="map-wrapper">
      <div id="map2Gis" className="map"></div>
    </div>
  )
})

export default MainMap2Gis
