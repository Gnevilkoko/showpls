import "./App.scss"
import "./i18n"
import AccessGate from "./pages/AccessGate"
import { Navigate, Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import Tasks from "./pages/Tasks"
import MapProvider from "./shared/providers/MapProvider"
import Wallet from "./pages/Wallet"
import Profile from "./pages/Profile"
import { useAppSelector } from "./store"
import AppInitializer from "./shared/components/AppInitializer"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import { TonWalletProvider } from "./shared/providers/TonWalletProvider"
import Chats from "./pages/Chats"
import ScrollToTop from "./shared/components/ScrollToTop"

function App() {
  const userData = useAppSelector((state) => state.user.userData)

  return (
    <AppInitializer>
      <TonConnectUIProvider manifestUrl="https://showpls-gitlab-dev.vercel.app/tonconnect-manifest.json">
        <TonWalletProvider>
          <MapProvider>
            <div className="app">
              <ScrollToTop />
              <Routes>
                {/* Если userData нет → открываем AccessGate, иначе редиректим на /home */}
                <Route path="/" element={userData ? <Navigate to="/home" replace /> : <AccessGate />} />
                <Route path="/home" element={userData ? <Home /> : <Navigate to="/" replace />} />
                <Route path="/tasks" element={userData ? <Tasks /> : <Navigate to="/" replace />} />
                <Route path="/chats" element={userData ? <Chats /> : <Navigate to="/" replace />} />
                <Route path="/wallet" element={userData ? <Wallet /> : <Navigate to="/" replace />} />
                <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/" replace />} />
              </Routes>
            </div>
          </MapProvider>
        </TonWalletProvider>
      </TonConnectUIProvider>
    </AppInitializer>
  )
}

export default App
