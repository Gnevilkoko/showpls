import { useLayoutEffect, useState } from "react"
import { useAppDispatch } from "../../store"
import { initLanguageFromTgAsync } from "../../store/languageSlice"
import { setAuthData } from "../../store/userSlice"
import { useSignInMutation } from "../../store/authApi"
import { tgService } from "../../services/webApp"
import type { TelegramWebAppUserType, UserDataType } from "../types"
import { useTranslation } from "react-i18next"

interface AppInitializerProps {
  children: React.ReactNode
}

const getFallbackUserData = (userFromTg: TelegramWebAppUserType): UserDataType => {
  return {
    id: userFromTg.id.toString(),
    role: "normal",
    tgId: userFromTg.id.toString(),
    username: userFromTg.username || null,
    firstName: userFromTg.first_name,
    lastName: userFromTg.last_name || null,
    languageCode: userFromTg.language_code || "en",
    avatar: userFromTg.photo_url || null,
    banned: false,
    lastSeenAt: Date.now().toString(),
    createdAt: Date.now().toString(),
    city: "Istanbul, Turkey",
    about: "freelancer photographer",
  }
}

const setFallbackAuth = (userFromTg: TelegramWebAppUserType, dispatch: ReturnType<typeof useAppDispatch>) => {
  const tempUser = getFallbackUserData(userFromTg)
  dispatch(
    setAuthData({
      accessToken: "temp-token",
      userData: tempUser,
    })
  )
}

const AppInitializer = ({ children }: AppInitializerProps) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [signIn] = useSignInMutation()
  const [isInitialized, setIsInitialized] = useState(false)

  useLayoutEffect(() => {
    const initializeApp = async () => {
      try {
        tgService.init() // инициализация WebApp и вызов expand()

        // Подхватываем язык из телеги если localStorage пуст
        const userFromTg = window.Telegram?.WebApp.initDataUnsafe?.user
        if (userFromTg) {
          dispatch(initLanguageFromTgAsync(userFromTg))
        }

        const initData = window.Telegram?.WebApp.initData

        // Пытаемся авторизоваться через бэкенд
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
            }
          } catch {
            // Fallback к Telegram данным при ошибке бэкенда
            if (userFromTg) {
              setFallbackAuth(userFromTg, dispatch)
            }
          }
        } else if (userFromTg) {
          // Fallback к Telegram данным если нет initData
          setFallbackAuth(userFromTg, dispatch)
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
