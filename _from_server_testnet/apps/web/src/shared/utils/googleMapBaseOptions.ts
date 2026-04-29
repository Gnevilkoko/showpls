import { GOOGLE_MAP_ID } from "../../constants"

/** Без mapId — растровая карта (стабильнее в WebView / при неверном ID в GCP). */
export function getGoogleMapBaseOptions(): google.maps.MapOptions {
  const o: google.maps.MapOptions = {
    disableDefaultUI: true,
    gestureHandling: "greedy",
  }
  if (GOOGLE_MAP_ID) {
    o.mapId = GOOGLE_MAP_ID
  }
  return o
}
