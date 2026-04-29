/**
 * Части HTTP API для нативного приложения.
 * Base path: `{origin}/api` (например https://testnet.showpls.com/api).
 *
 * Регистрация push: Authorization: Bearer <accessToken>, тело JSON.
 * Обмен кода после deep link: JWT из `?code=` передаётся в теле POST (поле `code`).
 *
 * Deep link завершения авторизации: `showpls://auth/callback?code=<jwt>`
 * Web (тот же код в query): `https://<host>/auth/callback?code=<jwt>`
 */
export const MobileApiRoutes = {
  registerPushToken: "POST /api/device/push-token",
  unregisterPushToken: "DELETE /api/device/push-token",
  exchangeAuthCallbackCode: "POST /api/auth/exchange-callback-code",
  signIn: "POST /api/auth/sign-in",
  phoneVerify: "POST /api/auth/phone/verify",
  unifiedAuthCallback: "POST /api/auth/callback",
} as const

/** Ожидаемая структура push (title/body в notification; остальное в data). */
export interface MobilePushPayload {
  title: string
  body: string
  /** Совпадает с серверным типом события (см. PushNotificationType на backend). */
  type: string
  entityId?: string | null
  /** Например showpls://chat/uuid */
  deeplink?: string | null
}
