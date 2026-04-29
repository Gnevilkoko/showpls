import { useLayoutEffect, useRef, useState } from "react"
import { store, useAppDispatch } from "../../store"
import { initLanguageFromTgAsync } from "../../store/languageSlice"
import { clearAuthData, setAuthData } from "../../store/userSlice"
import { useSignInMutation } from "../../store/api/authApi"
import { tgService } from "../../services/webApp"
import { useTranslation } from "react-i18next"

interface AppInitializerProps {
  children: React.ReactNode
}


const AppInitializer = ({ children }: AppInitializerProps) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [signIn] = useSignInMutation()
  const [isInitialized, setIsInitialized] = useState(false)
  const initializedRef = useRef(false)

  useLayoutEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeApp = async () => {
      try {
        tgService.init()

        const userFromTg = window.Telegram?.WebApp.initDataUnsafe?.user
        if (userFromTg) {
          dispatch(initLanguageFromTgAsync(userFromTg))
        }

        const initData = window.Telegram?.WebApp.initData || ""

        let authenticatedViaTelegram = false

        if (initData) {
          try {
            const result = await signIn({
              type: "tg-mini-app",
              payload: initData,
            }).unwrap()

            if (result.accessToken && result.user) {
              dispatch(
                setAuthData({
                  accessToken: result.accessToken,
                  userData: result.user,
                })
              )
              authenticatedViaTelegram = true
            }
          } catch {
            authenticatedViaTelegram = false
          }
        }

        if (!authenticatedViaTelegram) {
          const hadPersistedSession = Boolean(
            store.getState().user.accessToken && store.getState().user.userData
          )
          try {
            const res = await fetch("/api/auth/refresh-token", { method: "POST", credentials: "include" })
            if (res.ok) {
              const data = (await res.json()) as { accessToken?: string; user?: unknown }
              if (data.accessToken && data.user) {
                dispatch(
                  setAuthData({ accessToken: data.accessToken, userData: data.user as import("../../shared/types").UserDataType })
                )
              } else if (!hadPersistedSession) {
                dispatch(clearAuthData())
              }
            } else if (!hadPersistedSession) {
              dispatch(clearAuthData())
            }
          } catch {
            if (!hadPersistedSession) {
              dispatch(clearAuthData())
            }
          }
        }
      } finally {
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [dispatch, signIn])

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">{t("loading")}</div>
      </div>
    )
  }

  return <>{children}</>
}

export default AppInitializer
