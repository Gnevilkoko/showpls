import { useJsApiLoader } from "@react-google-maps/api"
import { API_KEY_GOOGLE_MAPS } from "../../constants"
import { GoogleMapContext } from "./GoogleMapContext"
import type { ReactNode } from "react"

interface GoogleMapProviderProps {
  children: ReactNode
}

const GoogleMapProvider: React.FC<GoogleMapProviderProps> = ({ children }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: API_KEY_GOOGLE_MAPS as string,
  })

  return <GoogleMapContext.Provider value={isLoaded}>{children}</GoogleMapContext.Provider>
}

export default GoogleMapProvider
