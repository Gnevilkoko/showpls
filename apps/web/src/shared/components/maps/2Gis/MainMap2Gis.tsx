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
}

// Центр карты Москвы, для 2ГИС нужно
// инвертировать гугловские координаты, сначала lng, потом lat
const centerMap = [37.623965, 55.74982]

const MainMap2Gis = memo(({ selectedTask, handleSelectTask, tasksList }: MapContainerProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null)
  const isMapInitializedRef = useRef(false)
  const isMapReadyRef = useRef(false)

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
            html: `<div class="cluster">${count}</div>`,
          }
        },
      })

      clustererInstance.load(markers)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clustererInstance.on("click", (event: any) => {
        if (event.target.type === "marker" && event.target.data?.task) {
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
      })
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
