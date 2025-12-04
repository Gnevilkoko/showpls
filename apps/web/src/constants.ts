const isDev = import.meta.env.DEV

export const BOT_USERNAME = isDev ? import.meta.env.VITE_DEV_BOT_USERNAME : "showpls_vercel_bot"
export const BOT_ID = isDev ? import.meta.env.VITE_DEV_BOT_ID : "8064276204"

export const API_KEY_GOOGLE_MAPS = "AIzaSyDJt2qqfPntS72Iw0qakVpDC7vH9VwzHn0"
// export const GOOGLE_MAP_ID = "326e5c0581dc4ddc71a87e5d"
// поставил случайную строку, ибо что то с mapID в гугл клауде
// если не надо кастомизировать карту - то оставляем как есть
export const GOOGLE_MAP_ID = "MAP_ID"

export const API_KEY_2GIS = "c0144d41-d27a-4c1b-8239-43d8dcbcea19"
export const STYLE_LIGHT_2GIS = "5fc1c0ac-5316-434b-99ea-37140198b1c1"
export const STYLE_DARK_2GIS = "803a2d8c-d1cd-498e-9238-1f791fb45419"

// export const URL_TOPUP_STARS = "https://functions.yandexcloud.net/d4e3loh0i8bq252142ka"

export const AVAILABLE_THEMES = ["light", "dark"] as const
