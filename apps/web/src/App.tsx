import "./App.scss"
import "./i18n"
import AccessGate from "./pages/AccessGate"
import { Navigate, Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Tasks from "./pages/Tasks"
import MapProvider from "./shared/providers/MapProvider"
import Wallet from "./pages/Wallet"
import Profile from "./pages/Profile"
import { useAppDispatch, useAppSelector } from "./store"
import { useEffect } from "react"
import { initLanguageFromTg } from "./store/languageSlice"
import { tgService } from "./services/webApp"
import { setUserTg } from "./store/userSlice"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import { TonWalletProvider } from "./shared/providers/TonWalletProvider"
import Chats from "./pages/Chats"
import ScrollToTop from "./shared/components/ScrollToTop"

function App() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user.tgData)

  const isDev = import.meta.env.MODE === "development"

  useEffect(() => {
    tgService.init() // инициализация WebApp и вызов expand()
    if (window.Telegram?.WebApp) {
      // обновляем стор пользователя если инициализировались
      dispatch(setUserTg(tgService.user))
    }
  }, [dispatch])

  // Подхватываем язык из tgData если localStorage пуст
  useEffect(() => {
    dispatch(initLanguageFromTg(user))
  }, [user, dispatch])

  return (
    <TonConnectUIProvider manifestUrl="https://showpls-gitlab-dev.vercel.app/tonconnect-manifest.json">
      <TonWalletProvider>
        <MapProvider>
          <div className="app">
            <ScrollToTop />
            <Routes>
              {/* Если user нет → открываем AccessGate,
        иначе редиректим на /home */}
              {/* <Route path="/" element={<AccessGate />} /> */}

              <Route path="/" element={user || isDev ? <Navigate to="/home" replace /> : <AccessGate />} />
              <Route path="/home" element={user || isDev ? <Home /> : <Navigate to="/" replace />} />
              <Route path="/tasks" element={user || isDev ? <Tasks /> : <Navigate to="/" replace />} />
              <Route path="/chats" element={user || isDev ? <Chats /> : <Navigate to="/" replace />} />
              <Route path="/wallet" element={user || isDev ? <Wallet /> : <Navigate to="/" replace />} />
              <Route path="/profile" element={user || isDev ? <Profile /> : <Navigate to="/" replace />} />
            </Routes>
          </div>
        </MapProvider>
      </TonWalletProvider>
    </TonConnectUIProvider>
  )
}

export default App
