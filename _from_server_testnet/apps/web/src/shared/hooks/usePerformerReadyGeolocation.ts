import { useEffect, useRef } from "react"
import { useStore } from "react-redux"
import { useAppDispatch, type RootState } from "../../store"
import { updateUserPartial } from "../../store/userSlice"
import { useToggleAvailableMutation, useUpdateUserLocationMutation } from "../../store/api/userApi"
import { NotificationHandler } from "../utils/notificationHandler"
import { clearGeolocationWatch, watchGeolocationPosition } from "../utils/performerDeviceProfile"

const MIN_SEND_INTERVAL_MS = 55_000

type Args = {
  isAvailable: boolean
  isVerified: boolean
  userId: string | undefined
}

/**
 * Пока включён «готов к работе»: фоном шлём координаты на сервер;
 * при отзыве геолокации — выключаем режим и просим разрешение снова.
 */
export function usePerformerReadyGeolocation({ isAvailable, isVerified, userId }: Args) {
  const dispatch = useAppDispatch()
  const store = useStore<RootState>()
  const [updateLocation] = useUpdateUserLocationMutation()
  const [toggleAvailable] = useToggleAvailableMutation()

  const lastSentAtRef = useRef(0)
  const disablingRef = useRef(false)

  useEffect(() => {
    if (!isAvailable || !isVerified || !userId) return

    const disableReady = async () => {
      if (disablingRef.current) return
      const stillOn = Boolean(store.getState().user.userData?.isAvailable)
      if (!stillOn) return
      disablingRef.current = true
      try {
        await toggleAvailable().unwrap()
        dispatch(updateUserPartial({ isAvailable: false }))
        NotificationHandler.showErrorTranslated("readyWorkRevokedNoPermission")
      } catch {
        dispatch(updateUserPartial({ isAvailable: false }))
        NotificationHandler.showErrorTranslated("readyWorkRevokedNoPermission")
      } finally {
        disablingRef.current = false
      }
    }

    let watchId: number | undefined
    let permCleanup: (() => void) | undefined

    const attachPermissionListener = () => {
      const perm = navigator.permissions?.query
      if (!perm) return
      void perm
        .call(navigator.permissions, { name: "geolocation" as PermissionName })
        .then((status) => {
          const onChange = () => {
            if (status.state === "denied") void disableReady()
          }
          onChange()
          status.addEventListener("change", onChange)
          permCleanup = () => status.removeEventListener("change", onChange)
        })
        .catch(() => {})
    }

    attachPermissionListener()

    /** Один поток: watchPosition (без второго getCurrentPosition — меньше промптов на телефоне). */
    watchId = watchGeolocationPosition(
      (pos) => {
        const now = Date.now()
        if (lastSentAtRef.current > 0 && now - lastSentAtRef.current < MIN_SEND_INTERVAL_MS) return
        lastSentAtRef.current = now
        void updateLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }).unwrap()
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) void disableReady()
      },
    )

    return () => {
      permCleanup?.()
      if (watchId != null && watchId >= 0) clearGeolocationWatch(watchId)
    }
  }, [isAvailable, isVerified, userId, dispatch, store, updateLocation, toggleAvailable])
}
