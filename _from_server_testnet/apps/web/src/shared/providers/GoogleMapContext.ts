import { createContext, useContext } from "react"

export const GoogleMapContext = createContext(false)

export const useGoogleMapLoaded = (): boolean => {
  return useContext(GoogleMapContext)
}
