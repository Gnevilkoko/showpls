import { useState } from "react"
import { useTranslation } from "react-i18next"
import background from "../../assets/images/access-gate-bg.webp"
import logoAnimation from "../../assets/animations/new-logo-animation.json"
import OpenMiniAppButton from "./OpenMiniAppButton"
import PhoneLoginForm from "./PhoneLoginForm"
import Lottie from "lottie-react"

type AuthMethod = "default" | "phone"

const AccessGate = () => {
  const { t } = useTranslation()
  const [authMethod, setAuthMethod] = useState<AuthMethod>("default")

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
            {t("accessGate.heroLine1")}
            <br />
            {t("accessGate.heroLine2")}
          </p>

          {authMethod === "default" ? (
            <>
              <OpenMiniAppButton />

              <div className="access-gate__divider">
                <span>{t("phoneAuth.or")}</span>
              </div>

              <button
                type="button"
                className="access-gate__phone-btn"
                onClick={() => setAuthMethod("phone")}
              >
                {t("phoneAuth.signInWithPhone")}
              </button>
            </>
          ) : (
            <PhoneLoginForm onBackToTelegram={() => setAuthMethod("default")} />
          )}
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
