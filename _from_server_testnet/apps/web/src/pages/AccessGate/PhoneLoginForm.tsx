import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAppDispatch } from "../../store"
import { setAuthData } from "../../store/userSlice"
import { usePhoneInitMutation, usePhoneVerifyMutation } from "../../store/api/authApi"
import { toast } from "react-toastify"

type Step = "phone" | "code"

interface PhoneLoginFormProps {
  onBackToTelegram: () => void
}

const PhoneLoginForm = ({ onBackToTelegram }: PhoneLoginFormProps) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const [phoneInit, { isLoading: isInitLoading }] = usePhoneInitMutation()
  const [phoneVerify, { isLoading: isVerifyLoading }] = usePhoneVerifyMutation()

  const [step, setStep] = useState<Step>("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState(["", "", "", ""])
  const [cooldown, setCooldown] = useState(0)

  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startCooldown = () => {
    setCooldown(60)
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handlePhoneSubmit = async () => {
    const normalized = phone.replace(/\D/g, "")
    if (normalized.length < 10) {
      toast.error(t("phoneAuth.invalidPhone"))
      return
    }

    try {
      await phoneInit({ phone: normalized }).unwrap()
      setStep("code")
      startCooldown()
      setTimeout(() => codeRefs.current[0]?.focus(), 100)
    } catch (e: any) {
      const msg = e?.data?.message || t("phoneAuth.initError")
      toast.error(msg)
    }
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const digit = value.slice(-1)
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    if (digit && index < 3) {
      codeRefs.current[index + 1]?.focus()
    }

    if (digit && index === 3) {
      const fullCode = [...newCode.slice(0, 3), digit].join("")
      if (fullCode.length === 4) {
        handleVerify(fullCode)
      }
    }
  }

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus()
    }
  }

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4)
    if (pasted.length === 4) {
      setCode(pasted.split(""))
      handleVerify(pasted)
    }
  }

  const handleVerify = async (codeStr: string) => {
    const normalized = phone.replace(/\D/g, "")
    try {
      const result = await phoneVerify({ phone: normalized, code: codeStr }).unwrap()
      if (result.accessToken && result.user) {
        dispatch(setAuthData({ accessToken: result.accessToken, userData: result.user }))
      }
    } catch (e: any) {
      toast.error(e?.data?.message || t("phoneAuth.invalidCode"))
      setCode(["", "", "", ""])
      codeRefs.current[0]?.focus()
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    const normalized = phone.replace(/\D/g, "")
    try {
      await phoneInit({ phone: normalized }).unwrap()
      setCode(["", "", "", ""])
      startCooldown()
      codeRefs.current[0]?.focus()
      toast.success(t("phoneAuth.codeSent"))
    } catch (e: any) {
      toast.error(e?.data?.message || t("phoneAuth.initError"))
    }
  }

  const handleBack = () => {
    setStep("phone")
    setCode(["", "", "", ""])
    if (timerRef.current) clearInterval(timerRef.current)
    setCooldown(0)
  }

  return (
    <div className="phone-auth">
      {step === "phone" ? (
        <div className="phone-auth__step">
          <p className="phone-auth__label">{t("phoneAuth.enterPhone")}</p>
          <div className="phone-auth__input-row">
            <input
              type="tel"
              className="phone-auth__input"
              placeholder="+7 900 000 0001"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePhoneSubmit()}
              autoFocus
            />
          </div>
          <button
            type="button"
            className="phone-auth__submit"
            onClick={handlePhoneSubmit}
            disabled={isInitLoading || phone.replace(/\D/g, "").length < 10}
          >
            {isInitLoading ? "..." : t("phoneAuth.getCode")}
          </button>
          <button type="button" className="phone-auth__back" onClick={onBackToTelegram}>
            ← {t("phoneAuth.backToTelegram")}
          </button>
        </div>
      ) : (
        <div className="phone-auth__step">
          <p className="phone-auth__label">{t("phoneAuth.enterCode")}</p>
          <p className="phone-auth__hint">{t("phoneAuth.codeHint")}</p>
          <div className="phone-auth__code-inputs" onPaste={handleCodePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { codeRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className="phone-auth__code-digit"
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                autoFocus={i === 0}
              />
            ))}
          </div>
          {isVerifyLoading && <p className="phone-auth__verifying">{t("phoneAuth.verifying")}</p>}
          <button
            type="button"
            className="phone-auth__resend"
            onClick={handleResend}
            disabled={cooldown > 0 || isInitLoading}
          >
            {cooldown > 0
              ? `${t("phoneAuth.resendIn")} ${cooldown}s`
              : t("phoneAuth.resend")}
          </button>
          <button type="button" className="phone-auth__back" onClick={handleBack}>
            ← {t("phoneAuth.changePhone")}
          </button>
        </div>
      )}
    </div>
  )
}

export default PhoneLoginForm
