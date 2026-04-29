import { useEffect, useRef } from "react"
import { useAppSelector, useAppDispatch } from "../../store"
import { setAuthData } from "../../store/userSlice"
import type { UserDataType } from "../types"

const REFRESH_INTERVAL_MS = 8 * 60 * 1000

/**
 * Периодически обновляет access JWT по httpOnly-сессии, чтобы не вылетать после истечения токена.
 * Дополняет reactive refresh в baseQuery (по 401).
 */
const SessionKeepAlive = () => {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.user.accessToken)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!accessToken) return

    const refresh = async () => {
      if (inFlight.current) return
      inFlight.current = true
      try {
        const res = await fetch("/api/auth/refresh-token", {
          method: "POST",
          credentials: "include",
          headers: { authorization: `Bearer ${accessToken}` },
        })
        if (!res.ok) return
        const data = (await res.json()) as { accessToken?: string; user?: UserDataType }
        if (data.accessToken && data.user) {
          dispatch(setAuthData({ accessToken: data.accessToken, userData: data.user }))
        }
      } catch {
        /* сеть / временный сбой — не разлогиниваем */
      } finally {
        inFlight.current = false
      }
    }

    const id = setInterval(refresh, REFRESH_INTERVAL_MS)

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [accessToken, dispatch])

  return null
}

export default SessionKeepAlive
