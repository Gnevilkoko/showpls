import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"
import { getGoogleMapBaseOptions } from "../../../utils/googleMapBaseOptions"
import { MarkerUtils, type Marker as ClusterMarker } from "@googlemaps/markerclusterer"
import type { PerformerType } from "../../../types"
import { createRoot, type Root } from "react-dom/client"
import PerformerItem from "../../../../pages/Tasks/PerformerItem"
import { useGetNearbyPerformersQuery } from "../../../../store/api/requestApi"
import type { PerformerNearby } from "../../../../shared/types/backend"
import PerformerMapPin from "../PerformerMapPin"
import { buildPerformerMapMarkerIcon } from "../../../utils/performerMapCanvasIcon"
import { performerMapDisplayNick } from "../../../utils/performerMapLabel"

interface PerformersMapGoogleProps {
  taskId?: string
}

const centerMap = { lat: 55.74982, lng: 37.623965 }

type MarkerCleanup = { marker: ClusterMarker; root?: Root }

const PerformersMapGoogle = memo(({ taskId }: PerformersMapGoogleProps) => {
  const mapOptions = useMemo(() => getGoogleMapBaseOptions(), [])
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const isLoaded = useGoogleMapLoaded()
  const mapPerformerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const performersContainerRef = useRef<HTMLDivElement | null>(null)
  const markerCleanupRef = useRef<MarkerCleanup[]>([])

  const { data: nearbyPerformersData } = useGetNearbyPerformersQuery(
    { requestId: taskId!, radius: 50 },
    { skip: !taskId }
  )

  const performersList = nearbyPerformersData?.items || []

  const handleLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }

  const scrollToSelectedPerformer = useCallback(
    (performer: PerformerType | PerformerNearby) => {
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

      const lat = "position" in performer ? performer.position.lat : performer.latitude
      const lng = "position" in performer ? performer.position.lng : performer.longitude

      map.panTo({ lat, lng })
    },
    [map]
  )

  useEffect(() => {
    if (!map) return
    let cancelled = false

    const run = async () => {
      for (const { marker, root } of markerCleanupRef.current) {
        MarkerUtils.setMap(marker, null)
        root?.unmount()
      }
      markerCleanupRef.current = []

      if (!performersList.length) return

      if (GOOGLE_MAP_ID) {
        const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
          AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
        }
        const { AdvancedMarkerElement } = markerLib

        if (cancelled) return

        performersList.forEach((performer) => {
          const content = document.createElement("div")
          const root = createRoot(content)
          root.render(
            <PerformerMapPin
              avatar={performer.avatar}
              username={performer.username ?? null}
              firstName={performer.firstName}
              lastName={performer.lastName}
              rating={performer.rating}
              accent={performer.rating >= 4.5}
            />
          )

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: performer.latitude, lng: performer.longitude },
            content,
          })

          marker.addListener("click", () => scrollToSelectedPerformer(performer))
          markerCleanupRef.current.push({ marker, root })
        })
      } else {
        if (cancelled) return

        for (const performer of performersList) {
          if (cancelled) return
          const accent = performer.rating >= 4.5
          const icon = await buildPerformerMapMarkerIcon({
            avatar: performer.avatar,
            username: performer.username ?? null,
            firstName: performer.firstName,
            lastName: performer.lastName,
            rating: performer.rating,
            accent,
          })
          const title = performerMapDisplayNick(performer.username ?? null, performer.firstName, performer.lastName)
          const marker = new google.maps.Marker({
            map,
            position: { lat: performer.latitude, lng: performer.longitude },
            title,
            icon,
            optimized: true,
          })

          marker.addListener("click", () => scrollToSelectedPerformer(performer))
          markerCleanupRef.current.push({ marker })
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      for (const { marker, root } of markerCleanupRef.current) {
        MarkerUtils.setMap(marker, null)
        root?.unmount()
      }
      markerCleanupRef.current = []
    }
  }, [map, performersList, scrollToSelectedPerformer])

  if (!isLoaded) return <p>Loading map…</p>

  return (
    <>
      <div className="map-wrapper">
        <GoogleMap mapContainerClassName="map" center={centerMap} zoom={14} onLoad={handleLoad} options={mapOptions} />
      </div>

      <div className="map-performers-wrapper">
        <div className="map-performers-container" ref={performersContainerRef}>
          {performersList.map((performer) => {
            const adaptedPerformer = {
              ...performer,
              position: { lat: performer.latitude, lng: performer.longitude },
              lastSeenAt: new Date(),
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
    </>
  )
})

export default PerformersMapGoogle
