import { useState } from "react"
import { useTranslation } from "react-i18next"
import background from "../../assets/images/access-gate-bg.webp"
import logoAnimation from "../../assets/animations/new-logo-animation.json"
import OpenMiniAppButton from "./OpenMiniAppButton"
import TelegramLoginButton from "./TelegramLoginButton"
import PhoneLoginForm from "./PhoneLoginForm"
import Lottie from "lottie-react"
import { BOT_ID } from "../../constants"
import type { TelegramAuthDataType } from "../../shared/types"
import { useAppDispatch } from "../../store"
import { setAuthData } from "../../store/userSlice"
import { useSignInMutation } from "../../store/api/authApi"
import { toast } from "react-toastify"

type AuthMethod = "default" | "phone"

const AccessGate = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [signIn] = useSignInMutation()
  const [authMethod, setAuthMethod] = useState<AuthMethod>("default")

  const handleAuthCallback = (data: TelegramAuthDataType) => {
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
      .catch((error: { status?: number; data?: { message?: string } }) => {
        console.error("Auth error:", error)
        const status = error?.status ?? (error as any)?.data?.statusCode
        const message = (error as any)?.data?.message
        if (status === 401) {
          toast.error(message || "Ошибка входа. Проверьте данные Telegram.")
        } else if (status === 500 || (error as any)?.status === "FETCH_ERROR") {
          toast.error("Ошибка сети или сервера. Проверьте подключение и попробуйте снова.")
        } else {
          toast.error(message || "Не удалось войти. Попробуйте ещё раз.")
        }
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
            {t("accessGate.heroLine1")}
            <br />
            {t("accessGate.heroLine2")}
          </p>

          {authMethod === "default" ? (
            <>
              <OpenMiniAppButton />
              <TelegramLoginButton botId={BOT_ID} onAuthCallback={handleAuthCallback} />

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
