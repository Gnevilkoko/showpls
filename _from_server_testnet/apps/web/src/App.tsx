import "./App.scss"
import "./i18n"
import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import GoogleMapProvider from "./shared/providers/GoogleMapProvider"
import { useAppSelector } from "./store"
import AppInitializer from "./shared/components/AppInitializer"
import { TonConnectUIProvider } from "@tonconnect/ui-react"
import { TonWalletProvider } from "./shared/providers/TonWalletProvider"
import ScrollManager from "./shared/components/ScrollManager"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import SocketManager from "./shared/components/SocketManager"
import SessionKeepAlive from "./shared/components/SessionKeepAlive"
import { useTranslation } from "react-i18next"

const AccessGate = lazy(() => import("./pages/AccessGate"))
const AuthCallback = lazy(() => import("./pages/AuthCallback"))
const Home = lazy(() => import("./pages/Home"))
const Tasks = lazy(() => import("./pages/Tasks"))
const Chats = lazy(() => import("./pages/Chats"))
const Chat = lazy(() => import("./pages/Chat"))
const Wallet = lazy(() => import("./pages/Wallet"))
const Profile = lazy(() => import("./pages/Profile"))
const ProfileAbout = lazy(() => import("./pages/Profile/screens/ProfileAbout"))
const ProfilePrivacy = lazy(() => import("./pages/Profile/screens/ProfilePrivacy"))
const AdminPanel = lazy(() => import("./pages/Admin"))

function RouteFallback() {
  const { t } = useTranslation()
  return (
    <div className="app-loading">
      <div className="loading-spinner">{t("loading")}</div>
    </div>
  )
}

function App() {
  const userData = useAppSelector((state) => state.user.userData)
  const theme = useAppSelector((state) => state.theme)

  return (
    <AppInitializer>
      <TonConnectUIProvider manifestUrl="https://showpls-gitlab-dev.vercel.app/tonconnect-manifest.json">
        <TonWalletProvider>
          <div className="app">
            <SocketManager />
            <SessionKeepAlive />
            <ScrollManager />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/" element={userData ? <Navigate to="/home" replace /> : <AccessGate />} />
                <Route path="/home" element={userData ? <Home /> : <Navigate to="/" replace />} />
                <Route
                  path="/tasks"
                  element={
                    userData ? (
                      <GoogleMapProvider>
                        <Tasks />
                      </GoogleMapProvider>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="/chats" element={userData ? <Chats /> : <Navigate to="/" replace />} />
                <Route
                  path="/chat/:id"
                  element={
                    userData ? (
                      <GoogleMapProvider>
                        <Chat />
                      </GoogleMapProvider>
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="/wallet" element={userData ? <Wallet /> : <Navigate to="/" replace />} />
                <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/" replace />} />
                <Route path="/profile/about" element={userData ? <ProfileAbout /> : <Navigate to="/" replace />} />
                <Route path="/profile/privacy" element={userData ? <ProfilePrivacy /> : <Navigate to="/" replace />} />
                <Route path="/admin" element={userData ? <AdminPanel /> : <Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <ToastContainer
              position="top-center"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={theme}
            />
          </div>
        </TonWalletProvider>
      </TonConnectUIProvider>
    </AppInitializer>
  )
}

export default App
