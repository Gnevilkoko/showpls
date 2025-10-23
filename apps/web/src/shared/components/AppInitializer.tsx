import { useLayoutEffect, useState } from "react"
import { useAppDispatch } from "../../store"
import { initLanguageFromTg } from "../../store/languageSlice"
import { setAuthData } from "../../store/userSlice"
import { useSignInMutation } from "../../store/authApi"
import { tgService } from "../../services/webApp"

interface AppInitializerProps {
  children: React.ReactNode
}

const AppInitializer = ({ children }: AppInitializerProps) => {
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
          dispatch(initLanguageFromTg(userFromTg))
        }

        const initData = window.Telegram?.WebApp.initData
        if (initData) {
          await signIn({
            type: "tg-mini-app",
            payload: initData,
          })
            .unwrap()
            .then((result) => {
              if (result.accessToken && result.user) {
                dispatch(
                  setAuthData({
                    accessToken: result.accessToken,
                    userData: result.user,
                  })
                )
              }
            })
            .catch((error) => {
              console.error("Auth error:", error)
            })
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
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}

export default AppInitializer
