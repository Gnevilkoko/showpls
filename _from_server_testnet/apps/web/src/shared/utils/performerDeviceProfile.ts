export type DeviceOsKind = "ios" | "android" | "web"

export type CollectedDeviceProfile = {
  os: DeviceOsKind
  osVersion: string
  deviceModel: string
  userAgent: string
}

type NavWithHints = Navigator & {
  userAgentData?: {
    mobile?: boolean
    platform?: string
    getHighEntropyValues?: (hints: string[]) => Promise<Record<string, string>>
  }
}

function detectBrowserName(ua: string): string {
  if (/Edg\//.test(ua)) return "Edge"
  if (/OPR\/|Opera\//.test(ua)) return "Opera"
  if (/Firefox\//.test(ua)) return "Firefox"
  if (/Chrome\//.test(ua)) return "Chrome"
  if (/Safari\//.test(ua)) return "Safari"
  return "Browser"
}

function parseIosVersion(ua: string): string {
  const m = ua.match(/OS (\d+[._]\d+(?:[._]\d+)?)/)
  return m ? m[1].replace(/_/g, ".") : ""
}

function parseIosModel(ua: string): string {
  if (/iPad/.test(ua)) return "iPad"
  if (/iPod/.test(ua)) return "iPod"
  return "iPhone"
}

function parseAndroidVersion(ua: string): string {
  const m = ua.match(/Android (\d+(?:\.\d+)*)/)
  return m ? m[1] : ""
}

function parseAndroidModel(ua: string): string {
  // "Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A...)"
  const m = ua.match(/Android[\d.]+;\s*(?:Linux;\s*)?([^;)]+?)(?:\s*Build\/|\s*\))/i)
  if (m) {
    const model = m[1].trim()
    if (model && model.toLowerCase() !== "mobile" && model.toLowerCase() !== "tablet") {
      return model
    }
  }
  return "Android device"
}

/**
 * Synchronously collect OS / device model from the browser environment.
 *
 * Priority:
 *  1. navigator.userAgentData  — authoritative for Chromium-based browsers and
 *     Android WebView (including Telegram Android). DevTools "Responsive" mode
 *     does NOT override userAgentData; only explicit device presets do.
 *  2. UA string + touch-points fallback — for Firefox and Safari (incl. iOS WebView).
 */
export function collectDeviceProfileSync(): CollectedDeviceProfile {
  if (typeof navigator === "undefined") {
    return { os: "web", osVersion: "", deviceModel: "Unknown", userAgent: "" }
  }

  const ua = navigator.userAgent || ""
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const nav = navigator as NavWithHints
  const uaData = nav.userAgentData

  // ── Path 1: userAgentData available (Chromium / Android WebView) ──────────
  if (uaData) {
    const uadPlatform = (uaData.platform ?? "").trim().toLowerCase()
    const uadMobile = Boolean(uaData.mobile)

    // iOS (rare via userAgentData, but handle it)
    if (uadPlatform === "ios" || uadPlatform === "iphone" || uadPlatform === "ipad") {
      return {
        os: "ios",
        osVersion: parseIosVersion(ua),
        deviceModel: parseIosModel(ua),
        userAgent: ua,
      }
    }

    // Android: platform says "android" OR mobile flag is set and UA has Android
    if (uadPlatform === "android" || (uadMobile && /Android/i.test(ua))) {
      return {
        os: "android",
        osVersion: parseAndroidVersion(ua),
        deviceModel: parseAndroidModel(ua),
        userAgent: ua,
      }
    }

    // Everything else (macOS, Windows, Linux, ChromeOS…) → web/desktop
    const browser = detectBrowserName(ua)
    const platform = navigator.platform || ""
    return {
      os: "web",
      osVersion: "",
      deviceModel: platform ? `${browser} (${platform})` : browser,
      userAgent: ua,
    }
  }

  // ── Path 2: no userAgentData (Firefox, Safari, some WebViews) ────────────
  // Require BOTH a mobile UA token AND touch support to call it mobile.
  if (/iPhone|iPod/i.test(ua) && maxTouchPoints > 0) {
    return { os: "ios", osVersion: parseIosVersion(ua), deviceModel: "iPhone", userAgent: ua }
  }
  if (/iPad/i.test(ua) && maxTouchPoints > 0) {
    return { os: "ios", osVersion: parseIosVersion(ua), deviceModel: "iPad", userAgent: ua }
  }
  if (/Android/i.test(ua) && maxTouchPoints > 0) {
    return {
      os: "android",
      osVersion: parseAndroidVersion(ua),
      deviceModel: parseAndroidModel(ua),
      userAgent: ua,
    }
  }

  const browser = detectBrowserName(ua)
  const platform = navigator.platform || ""
  return {
    os: "web",
    osVersion: "",
    deviceModel: platform ? `${browser} (${platform})` : browser,
    userAgent: ua,
  }
}

/**
 * Enrich model / OS version via User-Agent Client Hints (Chromium only).
 * Only enriches MOBILE profiles — desktop "web" profiles are left unchanged.
 */
export async function enrichDeviceProfileWithHints(
  base: CollectedDeviceProfile,
): Promise<CollectedDeviceProfile> {
  if (base.os === "web") return base

  const uaData = (navigator as NavWithHints).userAgentData
  if (!uaData?.getHighEntropyValues) return base

  try {
    const h = await uaData.getHighEntropyValues(["model", "platformVersion"])
    const model = h.model?.trim()
    const platformVersion = h.platformVersion?.trim()

    return {
      ...base,
      deviceModel:
        model && model.length > 0 && model.toLowerCase() !== "unknown" ? model : base.deviceModel,
      osVersion:
        platformVersion && platformVersion.length > 0 ? platformVersion : base.osVersion,
    }
  } catch {
    return base
  }
}

export function requestGeolocationPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GEO_UNSUPPORTED"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 25_000,
      maximumAge: 45_000,
    })
  })
}

/** Периодическое слежение за координатами (например, в режиме «готов к работе»). Возвращает -1, если API недоступен. */
export function watchGeolocationPosition(
  onSuccess: (pos: GeolocationPosition) => void,
  onError: (err: GeolocationPositionError) => void,
): number {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return -1
  }
  return navigator.geolocation.watchPosition(onSuccess, onError, {
    enableHighAccuracy: false,
    maximumAge: 45_000,
    timeout: 25_000,
  })
}

export function clearGeolocationWatch(watchId: number): void {
  if (watchId < 0 || typeof navigator === "undefined" || !navigator.geolocation) return
  navigator.geolocation.clearWatch(watchId)
}
