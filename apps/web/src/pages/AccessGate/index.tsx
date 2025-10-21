import background from "../../assets/images/access-gate-bg.webp"
import logoAnimation from "../../assets/animations/logo-animation.json"
import OpenTelegramButton from "./OpenTelegramButton"
import Lottie from "lottie-react"
import { LoginButton } from "@telegram-auth/react"
import { BOT_USERNAME } from "../../constants"

interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

const AccessGate = () => {
  const handleAuthCallback = (data: TelegramAuthData) => {
    alert(`Получил: $${data.first_name}`)

    // fetch('/api/auth/sign-in', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     type: 'tg-login-widget',
    //     payload: data
    //   })
    // });
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

          <LoginButton
            botUsername={BOT_USERNAME}
            onAuthCallback={handleAuthCallback}
            buttonSize="large"
            cornerRadius={5}
            showAvatar={true}
            lang="en"
          />
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
