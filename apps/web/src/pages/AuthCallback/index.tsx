import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAppDispatch } from "../../store"
import { setAuthData } from "../../store/userSlice"
import { useExchangeCallbackCodeMutation } from "../../store/api/authApi"
import { toast } from "react-toastify"

/**
 * https://…/auth/callback?code=<JWT> — обмен кода на сессию + accessToken.
 * Тот же `code`, что в showpls://auth/callback?code=…
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [exchange, { isLoading }] = useExchangeCallbackCodeMutation()
  const [message, setMessage] = useState("Вход…")

  useEffect(() => {
    const code = searchParams.get("code")?.trim()
    if (!code) {
      setMessage("Не указан код авторизации")
      toast.error("Ссылка входа неполная (нет code).")
      const t = setTimeout(() => navigate("/", { replace: true }), 2500)
      return () => clearTimeout(t)
    }

    let cancelled = false
    ;(async () => {
      try {
        const result = await exchange({ code }).unwrap()
        if (cancelled) return
        if (result.accessToken && result.user) {
          dispatch(setAuthData({ accessToken: result.accessToken, userData: result.user }))
          navigate("/home", { replace: true })
        }
      } catch (e: unknown) {
        if (cancelled) return
        const msg =
          (e as { data?: { message?: string } })?.data?.message || "Не удалось войти по ссылке."
        setMessage(msg)
        toast.error(msg)
        setTimeout(() => navigate("/", { replace: true }), 2800)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, exchange, dispatch, navigate])

  return (
    <div className="page auth-callback">
      <p className="auth-callback__text">{isLoading ? "Вход…" : message}</p>
    </div>
  )
}

export default AuthCallback
