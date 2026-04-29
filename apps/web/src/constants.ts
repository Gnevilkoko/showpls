export const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME
export const BOT_ID = import.meta.env.VITE_BOT_ID
export const TG_SCHEME = `tg://resolve?domain=${BOT_USERNAME}`
export const TME_LINK = `https://t.me/${BOT_USERNAME}`

export const API_KEY_GOOGLE_MAPS = "AIzaSyDJt2qqfPntS72Iw0qakVpDC7vH9VwzHn0"
/**
 * Только из .env: реальный Map ID из того же GCP-проекта, что и ключ (Maps JavaScript API + vector).
 * Если пусто — raster map без vectortown-worker и advanced markers; пины через google.maps.Marker.
 */
export const GOOGLE_MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined)?.trim() ?? ""

export const API_KEY_2GIS =
  import.meta.env.VITE_API_KEY_2GIS ?? "c0144d41-d27a-4c1b-8239-43d8dcbcea19"
export const STYLE_LIGHT_2GIS = "5fc1c0ac-5316-434b-99ea-37140198b1c1"
export const STYLE_DARK_2GIS = "803a2d8c-d1cd-498e-9238-1f791fb45419"

// export const URL_TOPUP_STARS = "https://functions.yandexcloud.net/d4e3loh0i8bq252142ka"

export const AVAILABLE_THEMES = ["light", "dark"] as const
