import { GoogleMap } from "@react-google-maps/api"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import pinIcon from "../../../../assets/icons/ui/pin.svg"
import { useGoogleMapLoaded } from "../../../providers/GoogleMapContext"
import { GOOGLE_MAP_ID } from "../../../../constants"
import { getGoogleMapBaseOptions } from "../../../utils/googleMapBaseOptions"

interface ChatMapGoogleProps {
  coordinates: { lat: number; lng: number }
}

const ChatMapGoogle = memo(({ coordinates }: ChatMapGoogleProps) => {
  const mapOptions = useMemo(() => getGoogleMapBaseOptions(), [])
  const isLoaded = useGoogleMapLoaded()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [mapIsFocused, setMapIsFocused] = useState(false)
  const markerRef = useRef<google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null>(null)

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
  }, [])

  useEffect(() => {
    if (!map || !coordinates) return

    const initMarker = async () => {
      if (markerRef.current) {
        if (markerRef.current instanceof google.maps.Marker) {
          markerRef.current.setMap(null)
        } else {
          markerRef.current.map = null
        }
        markerRef.current = null
      }

      if (GOOGLE_MAP_ID) {
        const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
          AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
        }
        const { AdvancedMarkerElement } = markerLib

        const content = document.createElement("div")
        content.className = "chat-map__marker"
        content.innerHTML = `<img src="${pinIcon}" alt="Pin Icon" />`

        markerRef.current = new AdvancedMarkerElement({
          map,
          position: coordinates,
          content,
        })
      } else {
        markerRef.current = new google.maps.Marker({
          map,
          position: coordinates,
          icon: {
            url: pinIcon,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          },
        })
      }
    }

    void initMarker()
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
