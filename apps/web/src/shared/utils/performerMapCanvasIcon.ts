import { performerMapDisplayNick } from "./performerMapLabel"

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * Для экспорта canvas в PNG: чужой origin — только с crossOrigin=anonymous и CORS на сервере.
 * Для своего origin (тот же хост, что и SPA, в т.ч. `/media` за Traefik) crossOrigin не ставим —
 * иначе запрос становится cors-mode и nginx без ACAO даёт ошибку загрузки.
 */
function loadImageForCanvas(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => resolve(null)
    const u = url.startsWith("//") ? `https:${url}` : url
    if (typeof window !== "undefined" && (u.startsWith("http://") || u.startsWith("https://"))) {
      try {
        if (new URL(u).origin !== window.location.origin) {
          im.crossOrigin = "anonymous"
        }
      } catch {
        /* ignore */
      }
    }
    im.src = u
  })
}

export type PerformerMapIconInput = {
  avatar: string | null
  username: string | null
  firstName: string
  lastName: string | null
  rating: number
  accent?: boolean
}

const W = 140
const H = 48
const R = 12

/**
 * PNG dataUrl для google.maps.Marker на растровой карте (ник + ★ + аватар).
 * При ошибке CORS/taint — простая иконка без падения.
 */
export async function buildPerformerMapMarkerIcon(p: PerformerMapIconInput): Promise<google.maps.Icon> {
  const accent = Boolean(p.accent ?? (Number.isFinite(p.rating) && p.rating >= 4.5))
  const dpr = typeof window !== "undefined" ? Math.min(2, window.devicePixelRatio || 1) : 2
  const canvas = document.createElement("canvas")
  canvas.width = W * dpr
  canvas.height = H * dpr
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return fallbackIcon()
  }
  ctx.scale(dpr, dpr)

  const bg = accent ? "#1b5e20" : "#263238"
  const bgHi = accent ? "#2e7d32" : "#37474f"

  roundRectPath(ctx, 0, 0, W, H, R)
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, bgHi)
  g.addColorStop(1, bg)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.28)"
  ctx.lineWidth = 1
  ctx.stroke()

  const cx = 24
  const cy = H / 2
  const cr = 17

  let avatarOk = false
  if (p.avatar?.length) {
    const src =
      p.avatar.startsWith("http") || p.avatar.startsWith("//") || p.avatar.startsWith("/")
        ? p.avatar.startsWith("/")
          ? `${typeof window !== "undefined" ? window.location.origin : ""}${p.avatar}`
          : p.avatar.startsWith("//")
            ? `https:${p.avatar}`
            : p.avatar
        : p.avatar
    const img = await loadImageForCanvas(src)
    if (img) {
      try {
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.clip()
        ctx.drawImage(img, cx - cr, cy - cr, cr * 2, cr * 2)
        ctx.restore()
        avatarOk = true
      } catch {
        avatarOk = false
      }
    }
  }

  if (!avatarOk) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, cr, 0, Math.PI * 2)
    ctx.fillStyle = "#455a64"
    ctx.fill()
    ctx.fillStyle = "#eceff1"
    ctx.font = "700 15px system-ui, -apple-system, sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText((p.firstName[0] || "?").toUpperCase(), cx, cy)
    ctx.restore()
  }

  ctx.strokeStyle = "rgba(255,255,255,0.45)"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(cx, cy, cr + 0.5, 0, Math.PI * 2)
  ctx.stroke()

  const nick = performerMapDisplayNick(p.username, p.firstName, p.lastName)
  const nickDraw = nick.length > 15 ? `${nick.slice(0, 14)}…` : nick
  ctx.fillStyle = "#ffffff"
  ctx.font = "600 11.5px system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  ctx.fillText(nickDraw, 48, 9)

  const r = Number.isFinite(p.rating) ? p.rating : 5
  ctx.fillStyle = "#ffeb3b"
  ctx.font = "700 11px system-ui, sans-serif"
  ctx.fillText(`★ ${r.toFixed(1)}`, 48, 26)

  let url: string
  try {
    url = canvas.toDataURL("image/png")
  } catch {
    return fallbackIcon()
  }

  return {
    url,
    scaledSize: new google.maps.Size(W, H),
    anchor: new google.maps.Point(W / 2, H),
  }
}

function fallbackIcon(): google.maps.Icon {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 10,
    fillColor: "#7e57c2",
    fillOpacity: 0.95,
    strokeColor: "#fff",
    strokeWeight: 2,
    anchor: new google.maps.Point(0, 0),
  }
}
