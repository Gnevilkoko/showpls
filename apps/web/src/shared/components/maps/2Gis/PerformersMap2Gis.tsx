import { load } from "@2gis/mapgl"
import { memo, useEffect, useRef, useCallback } from "react"
import { Clusterer } from "@2gis/mapgl-clusterer"
import { API_KEY_2GIS, STYLE_DARK_2GIS, STYLE_LIGHT_2GIS } from "../../../../constants"
import type { PerformerType } from "../../../types"
import { performersData } from "../../../../pages/Tasks/performersData"
import statsStarWhiteIcon from "../../../../assets/icons/status/stats-star-white.svg"
import PerformerItem from "../../../../pages/Tasks/PerformerItem"
import { useAppSelector, type RootState } from "../../../../store"

// Центр карты Москвы, для 2ГИС нужно
// инвертировать гугловские координаты, сначала lng, потом lat
const centerMap = [37.623965, 55.74982]

const PerformersMap2Gis = memo(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clustererRef = useRef<any>(null)
  const isMapInitializedRef = useRef(false)
  const isMapReadyRef = useRef(false)
  const mapPerformerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const performersContainerRef = useRef<HTMLDivElement | null>(null)

  const theme = useAppSelector((state: RootState) => state.theme)
  // Меняем тему на лету
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyleById(theme === "light" ? STYLE_LIGHT_2GIS : STYLE_DARK_2GIS)
    }
  }, [theme])

  // Плавный скролл к выбранному исполнителю в списке
  const scrollToSelectedPerformer = useCallback((performer: PerformerType) => {
    if (!mapRef.current || !isMapReadyRef.current || !performersContainerRef.current) return

    const itemRef = mapPerformerRefs.current[performer.id.toString()]
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

    // Центрирование карты на выбранном исполнителе
    const coordinates = [performer.position.lng, performer.position.lat]
    if (mapRef.current.easeTo) {
      mapRef.current.easeTo({ center: coordinates })
    } else if (mapRef.current.setCenter) {
      mapRef.current.setCenter(coordinates)
    }

    requestAnimationFrame(animateScroll)
  }, [])

  // Создание маркеров из списка исполнителей
  const createMarkers = useCallback((performers: PerformerType[]) => {
    return performers.map((performer) => ({
      type: "html" as const,
      coordinates: [performer.position.lng, performer.position.lat],
      html: `<div class="custom-marker map2gis-marker ${performer.rating >= 4.5 ? "accent" : ""}">
          <div class="custom-marker__content">
            ${performer.rating}${performer.rating % 1 === 0 ? ".0" : ""}
            <span><img src="${statsStarWhiteIcon}" /></span>
          </div>
        </div>`,
      performer: performer,
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
        if (event.target.type === "marker" && event.target.data?.performer) {
          scrollToSelectedPerformer(event.target.data.performer)
        }
      })

      return clustererInstance
    },
    [scrollToSelectedPerformer]
  )

  // Инициализация карты - только один раз
  useEffect(() => {
    if (isMapInitializedRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    load().then((mapglAPI) => {
      if (isMapInitializedRef.current) return

      mapInstance = new mapglAPI.Map("map2GisPerformers", {
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
        if (performersData.length) {
          const markers = createMarkers(performersData)
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
  }, [createMarkers, createClusterer, theme])

  return (
    <>
      <div className="map-wrapper">
        <div id="map2GisPerformers" className="map"></div>
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
              handleSelectPerformer={() => scrollToSelectedPerformer(performer)}
            />
          ))}
        </div>
      </div>
    </>
  )
})

export default PerformersMap2Gis
