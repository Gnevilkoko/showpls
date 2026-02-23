import { useLayoutEffect, useState } from "react"
import { useAppDispatch } from "../../store"
import { initLanguageFromTgAsync } from "../../store/languageSlice"
import { setAuthData } from "../../store/userSlice"
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
            // Auth failed, do nothing, so user stays unauthenticated
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
