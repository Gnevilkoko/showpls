import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"
import { getGoogleMapBaseOptions } from "../../../utils/googleMapBaseOptions"
import { MarkerClusterer, MarkerUtils, type Marker as ClusterMarker } from "@googlemaps/markerclusterer"
import type { PerformerType, TaskType } from "../../../types"
import { createRoot, type Root } from "react-dom/client"
import starsWhiteIcon from "../../../../assets/icons/status/stars-white.svg"
import PerformerItem from "../../../../pages/Tasks/PerformerItem"
import PerformerMapPin from "../PerformerMapPin"
import { buildPerformerMapMarkerIcon } from "../../../utils/performerMapCanvasIcon"
import { performerMapDisplayNick } from "../../../utils/performerMapLabel"

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

/** Исполнители «готов к работе» на карте (данные с бэкенда) */
export type MainMapPerformerRow = {
  id: string
  username: string | null
  firstName: string
  lastName: string | null
  avatar: string | null
  latitude: number
  longitude: number
  rating: number
  distance: number
}

interface MainMapGoogleProps {
  selectedTask: TaskType | null
  handleSelectTask: (task: TaskType) => void
  tasksList: TaskType[]
  /** По умолчанию маркеры задач; в режиме исполнителя — все готовые исполнители с геометкой */
  mode?: "tasks" | "performers"
  performersList?: MainMapPerformerRow[]
}

/** Не рендерим сотни карточек внизу — только карта + кластеры */
const MAX_PERFORMERS_STRIP = 48

const centerMap = { lat: 55.74982, lng: 37.623965 }

const MainMapGoogle = memo(
  ({
    selectedTask,
    handleSelectTask,
    tasksList,
    mode = "tasks",
    performersList = [],
  }: MainMapGoogleProps) => {
    const [map, setMap] = useState<google.maps.Map | null>(null)
    const isLoaded = useGoogleMapLoaded()
    const markersRef = useRef<Map<string, ClusterMarker>>(new Map())
    const rootsRef = useRef<Map<string, Root>>(new Map())
    const clustererRef = useRef<MarkerClusterer | null>(null)

    const performerMarkersRef = useRef<Map<string, ClusterMarker>>(new Map())
    const performerRootsRef = useRef<Map<string, Root>>(new Map())
    const performerClustererRef = useRef<MarkerClusterer | null>(null)
    const mapPerformerRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const performersContainerRef = useRef<HTMLDivElement | null>(null)

    const mapOptions = useMemo(() => getGoogleMapBaseOptions(), [])

    const handleLoad = useCallback((mapInstance: google.maps.Map) => {
      setMap(mapInstance)
    }, [])

    const scrollToSelectedPerformer = useCallback(
      (performer: MainMapPerformerRow) => {
        if (!map || !performersContainerRef.current) return

        const itemRef = mapPerformerRefs.current[performer.id.toString()]
        const container = performersContainerRef.current

        if (itemRef && container) {
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
        }

        map.panTo({ lat: performer.latitude, lng: performer.longitude })
      },
      [map]
    )

    useEffect(() => {
      if (map && selectedTask) {
        map.panTo(selectedTask.position)
      }
    }, [map, selectedTask])

    const previousTaskIdsRef = useRef<Set<string>>(new Set())

    useEffect(() => {
      if (!map) return

      if (mode === "performers") {
        if (clustererRef.current) {
          clustererRef.current.clearMarkers()
          clustererRef.current = null
        }
        for (const [, marker] of markersRef.current.entries()) {
          MarkerUtils.setMap(marker, null)
        }
        for (const [, root] of rootsRef.current.entries()) {
          root.unmount()
        }
        markersRef.current.clear()
        rootsRef.current.clear()
        previousTaskIdsRef.current = new Set()
        return
      }

      const updateMarkers = async () => {
        const currentTaskIds = new Set(tasksList.map((task) => task.id))

        const previousTaskIds = previousTaskIdsRef.current
        const taskIdsChanged =
          currentTaskIds.size !== previousTaskIds.size || ![...currentTaskIds].every((id) => previousTaskIds.has(id))

        if (!taskIdsChanged && clustererRef.current) {
          return
        }

        previousTaskIdsRef.current = currentTaskIds

        if (clustererRef.current) {
          clustererRef.current.clearMarkers()
          clustererRef.current = null
        }

        for (const [taskId, marker] of markersRef.current.entries()) {
          if (!currentTaskIds.has(taskId)) {
            MarkerUtils.setMap(marker, null)
            const root = rootsRef.current.get(taskId)
            if (root) {
              root.unmount()
            }
            markersRef.current.delete(taskId)
            rootsRef.current.delete(taskId)
          }
        }

        if (GOOGLE_MAP_ID) {
          const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
            AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
          }
          const { AdvancedMarkerElement } = markerLib

          const markers: google.maps.marker.AdvancedMarkerElement[] = []

          tasksList.forEach((task) => {
            if (markersRef.current.has(task.id)) {
              markers.push(markersRef.current.get(task.id)! as google.maps.marker.AdvancedMarkerElement)
              return
            }

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
        } else {
          const markers: google.maps.Marker[] = []

          tasksList.forEach((task) => {
            if (markersRef.current.has(task.id)) {
              markers.push(markersRef.current.get(task.id)! as google.maps.Marker)
              return
            }

            const marker = new google.maps.Marker({
              map,
              position: task.position,
              title: String(task.price),
              icon: {
                url: starsWhiteIcon,
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40),
              },
            })

            marker.addListener("click", () => handleSelectTask(task))

            markersRef.current.set(task.id, marker)
            markers.push(marker)
          })

          if (markers.length > 0) {
            clustererRef.current = new MarkerClusterer({
              map,
              markers,
              renderer: {
                render: ({ count, position }) =>
                  new google.maps.Marker({
                    position,
                    label: { text: String(count), color: "#111", fontSize: "11px", fontWeight: "700" },
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 18,
                      fillColor: "#5c6bc0",
                      fillOpacity: 0.95,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    },
                  }),
              },
            })
          }
        }
      }

      void updateMarkers()
    }, [map, tasksList, handleSelectTask, mode])

    useEffect(() => {
      if (!map) return

      if (mode !== "performers") {
        if (performerClustererRef.current) {
          performerClustererRef.current.clearMarkers()
          performerClustererRef.current = null
        }
        for (const [, marker] of performerMarkersRef.current.entries()) {
          MarkerUtils.setMap(marker, null)
        }
        for (const [, root] of performerRootsRef.current.entries()) {
          root.unmount()
        }
        performerMarkersRef.current.clear()
        performerRootsRef.current.clear()
        return
      }

      let cancelled = false

      const updatePerformerMarkers = async () => {
        if (cancelled) return

        if (performerClustererRef.current) {
          performerClustererRef.current.clearMarkers()
          performerClustererRef.current = null
        }

        for (const [, marker] of performerMarkersRef.current.entries()) {
          MarkerUtils.setMap(marker, null)
        }
        for (const [, root] of performerRootsRef.current.entries()) {
          root.unmount()
        }
        performerMarkersRef.current.clear()
        performerRootsRef.current.clear()

        if (GOOGLE_MAP_ID) {
          const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
            AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
          }
          const { AdvancedMarkerElement } = markerLib

          if (cancelled) return

          const markers: google.maps.marker.AdvancedMarkerElement[] = []

          performersList.forEach((performer) => {
            const content = document.createElement("div")

            const root = createRoot(content)
            root.render(
              <PerformerMapPin
                avatar={performer.avatar}
                username={performer.username}
                firstName={performer.firstName}
                lastName={performer.lastName}
                rating={performer.rating}
                accent={performer.rating >= 4.5}
              />,
            )

            const marker = new AdvancedMarkerElement({
              map,
              position: { lat: performer.latitude, lng: performer.longitude },
              content,
            })

            marker.addListener("click", () => scrollToSelectedPerformer(performer))

            performerMarkersRef.current.set(performer.id, marker)
            performerRootsRef.current.set(performer.id, root)
            markers.push(marker)
          })

          if (markers.length > 0) {
            performerClustererRef.current = new MarkerClusterer({
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
        } else {
          if (cancelled) return

          const markers: google.maps.Marker[] = []

          for (const performer of performersList) {
            if (cancelled) return
            const accent = performer.rating >= 4.5
            const icon = await buildPerformerMapMarkerIcon({
              avatar: performer.avatar,
              username: performer.username,
              firstName: performer.firstName,
              lastName: performer.lastName,
              rating: performer.rating,
              accent,
            })
            const title = performerMapDisplayNick(performer.username, performer.firstName, performer.lastName)
            const marker = new google.maps.Marker({
              map,
              position: { lat: performer.latitude, lng: performer.longitude },
              title,
              icon,
              optimized: true,
            })

            marker.addListener("click", () => scrollToSelectedPerformer(performer))

            performerMarkersRef.current.set(performer.id, marker)
            markers.push(marker)
          }

          if (markers.length > 0) {
            performerClustererRef.current = new MarkerClusterer({
              map,
              markers,
              renderer: {
                render: ({ count, position }) =>
                  new google.maps.Marker({
                    position,
                    label: { text: String(count), color: "#111", fontSize: "11px", fontWeight: "700" },
                    icon: {
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 18,
                      fillColor: "#7e57c2",
                      fillOpacity: 0.95,
                      strokeColor: "#fff",
                      strokeWeight: 2,
                    },
                  }),
              },
            })
          }
        }
      }

      void updatePerformerMarkers()

      return () => {
        cancelled = true
        if (performerClustererRef.current) {
          performerClustererRef.current.clearMarkers()
          performerClustererRef.current = null
        }
      }
    }, [map, mode, performersList, scrollToSelectedPerformer])

    if (!isLoaded) return <p>Loading map…</p>

    return (
      <>
        <div className="map-wrapper">
          <GoogleMap
            mapContainerClassName="map"
            center={centerMap}
            zoom={14}
            onLoad={handleLoad}
            options={mapOptions}
          />
        </div>

        {mode === "performers" &&
          performersList.length > 0 &&
          performersList.length <= MAX_PERFORMERS_STRIP && (
          <div className="map-performers-wrapper">
            <div className="map-performers-container" ref={performersContainerRef}>
              {performersList.map((performer) => {
                const adaptedPerformer: PerformerType = {
                  id: performer.id,
                  firstName: performer.firstName,
                  lastName: performer.lastName,
                  avatar: performer.avatar,
                  position: { lat: performer.latitude, lng: performer.longitude },
                  lastSeenAt: new Date(),
                  rating: performer.rating,
                }

                return (
                  <PerformerItem
                    key={performer.id}
                    performer={adaptedPerformer}
                    ref={(el: HTMLDivElement | null) => {
                      mapPerformerRefs.current[performer.id.toString()] = el
                    }}
                    handleSelectPerformer={() => scrollToSelectedPerformer(performer)}
                  />
                )
              })}
            </div>
          </div>
        )}
      </>
    )
  }
)

export default MainMapGoogle
