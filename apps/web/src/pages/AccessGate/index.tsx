import background from "../../assets/images/access-gate-bg.webp"
// import logoAnimation from "../../assets/animations/logo-animation.json"
import logoAnimation from "../../assets/animations/new-logo-animation.json"
import OpenTelegramButton from "./OpenTelegramButton"
import TelegramLoginButton from "./TelegramLoginButton"
import Lottie from "lottie-react"
import { BOT_ID } from "../../constants"
import type { TelegramAuthDataType } from "../../shared/types"
import { useAppDispatch } from "../../store"
import { setAuthData } from "../../store/userSlice"
import { useSignInMutation } from "../../store/api/authApi"

const AccessGate = () => {
  const dispatch = useAppDispatch()
  const [signIn] = useSignInMutation()

  const handleAuthCallback = (data: TelegramAuthDataType) => {
    // Обрабатываем авторизацию
    signIn({
      type: "tg-login-widget",
      payload: data,
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

  return (
    <div className="page access-gate">
      <img src={background} alt="Background" fetchPriority="high" className="access-gate__background" />

      <div className="access-gate__logo">
        <Lottie animationData={logoAnimation} />
      </div>

      <div className="access-gate__container">
        <div className="access-gate__content">
          <h1 className="access-gate__header">Welcome to Showpls!</h1>

          <p className="access-gate__description">
            8.7 billion eye. One Global Workforce
            <br />
            Every smartphone, camera, drone can earn with Showpls
          </p>

          <OpenTelegramButton />

          <TelegramLoginButton botId={BOT_ID} onAuthCallback={handleAuthCallback} />
        </div>

        <footer className="access-gate__footer">
          <div className="access-gate__copyright">@2025 Showpls</div>

          <nav className="access-gate__footer__links">
            <a href="/">Terms</a>

            <a href="/">Privacy</a>

            <a href="/">Support</a>
          </nav>
        </footer>
      </div>
    </div>
  )
}

export default AccessGate
