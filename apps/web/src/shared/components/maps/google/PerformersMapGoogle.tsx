import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"
import type { PerformerType } from "../../../types"
import { createRoot } from "react-dom/client"
import { performersData } from "../../../../pages/Tasks/performersData"
import statsStarWhiteIcon from "../../../../assets/icons/status/stats-star-white.svg"
import PerformerItem from "../../../../pages/Tasks/PerformerItem"

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

const centerMap = { lat: 55.74982, lng: 37.623965 }

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: GOOGLE_MAP_ID,
  gestureHandling: "greedy",
}

const PerformersMapGoogle = memo(() => {
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const isLoaded = useGoogleMapLoaded()
  const mapPerformerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const performersContainerRef = useRef<HTMLDivElement | null>(null)
  const isMarkersInitializedRef = useRef(false)

  const handleLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }

  // Плавный скролл к выбранному исполнителю в списке
  const scrollToSelectedPerformer = useCallback(
    (performer: PerformerType) => {
      if (!map || !performersContainerRef.current) return

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

      map.panTo(performer.position)
      requestAnimationFrame(animateScroll)
    },
    [map]
  )

  // Инициализация маркеров: создание маркеров на карте только один раз
  useEffect(() => {
    if (!map || isMarkersInitializedRef.current) return

    const initMarkers = async () => {
      const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
      }
      const { AdvancedMarkerElement } = markerLib

      performersData.forEach((performer) => {
        const content = document.createElement("div")
        content.className = `custom-marker ${performer.rating >= 4.5 ? "accent" : ""}`

        const root = createRoot(content)
        root.render(<MarkerContent count={performer.rating} image={statsStarWhiteIcon} />)

        const marker = new AdvancedMarkerElement({
          map,
          position: performer.position,
          content,
        })

        marker.addListener("click", () => scrollToSelectedPerformer(performer))
      })

      isMarkersInitializedRef.current = true
    }

    initMarkers()
  }, [map, scrollToSelectedPerformer])

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
              handleSelectPerformer={() => scrollToSelectedPerformer(performer)}
            />
          ))}
        </div>
      </div>
    </>
  )
})

export default PerformersMapGoogle
