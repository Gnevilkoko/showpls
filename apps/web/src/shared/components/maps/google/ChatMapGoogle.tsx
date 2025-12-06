import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useRef, useState } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: GOOGLE_MAP_ID,
  gestureHandling: "greedy",
}

interface ChatMapGoogleProps {
  coordinates: { lat: number; lng: number }
}

const ChatMapGoogle = memo(({ coordinates }: ChatMapGoogleProps) => {
  const isLoaded = useGoogleMapLoaded()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapIsFocused, setMapIsFocused] = useState(false)
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  // Создаем маркер на карте
  useEffect(() => {
    if (!map || !coordinates) return

    const initMarker = async () => {
      const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
      }
      const { AdvancedMarkerElement } = markerLib

      // Удаляем предыдущий маркер если есть
      if (markerRef.current) {
        markerRef.current.map = null
      }

      // Создаем контент для маркера
      const content = document.createElement("div")
      content.className = "chat-map__marker"
      content.innerHTML = `<img src="${pinIcon}" alt="Pin Icon" />`

      // Создаем новый маркер
      const marker = new AdvancedMarkerElement({
        map,
        position: coordinates,
        content,
      })

      markerRef.current = marker
    }

    initMarker()
  }, [map, coordinates])

  const timeoutRef = useRef<number | null>(null)

  const handlePointerUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      setMapIsFocused(false)
      timeoutRef.current = null
    }, 3000)
  }

  if (!isLoaded) return <p>Loading map…</p>

  return (
    <div
      className={`chat-map-wrapper ${mapIsFocused ? "focus" : ""}`}
      onPointerDown={() => setMapIsFocused(true)}
      onPointerUp={handlePointerUp}
    >
      <GoogleMap
        mapContainerClassName="chat-map"
        center={coordinates}
        zoom={16}
        onLoad={handleLoad}
        options={mapOptions}
      />
    </div>
  )
})

export default ChatMapGoogle
