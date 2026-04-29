import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import { toast } from "react-toastify"
import type { RootState } from "../index"
import { clearAuthData, setAuthData } from "../userSlice"

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  timeout: 20000,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState
    const token = state.user?.accessToken

    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }

    return headers
  },
})

const baseQueryPublic = fetchBaseQuery({
  baseUrl: "/api",
  credentials: "include",
  timeout: 20000,
})

let isRefreshing = false
let refreshPromise: Promise<void> | null = null
const REFRESH_WAIT_TIMEOUT_MS = 8000

async function waitRefreshSafe(promise: Promise<void>, timeoutMs: number): Promise<boolean> {
  try {
    await Promise.race([
      promise,
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), timeoutMs)
      }),
    ])
    return true
  } catch {
    return false
  }
}

/**
 * Общий baseQuery конфиг для всех API которые требуют аутентификации
 * Перехватывает ошибки 401, пытается обновить токен и повторяет оригинальный запрос
 * Перехватывает ошибки 403, 404, 500
 */
export const authenticatedBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  // Если обновление токена уже идет, ждем его завершения
  if (isRefreshing && refreshPromise) {
    const ok = await waitRefreshSafe(refreshPromise, REFRESH_WAIT_TIMEOUT_MS)
    if (!ok) {
      isRefreshing = false
      refreshPromise = null
    }
  }

  let result = await baseQueryWithAuth(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // Нет Bearer в стейте — сессия может жить в httpOnly cookie; пробуем refresh, как при протухшем JWT.
    if (!isRefreshing) {
      isRefreshing = true

      const runRefresh = async () => {
        try {
          const refreshResult = await baseQueryPublic(
            { url: "/auth/refresh-token", method: "POST" },
            api,
            extraOptions
          )

          if (refreshResult.data) {
            // Успешно обновили
            const data = refreshResult.data as { accessToken: string; user: any }
            api.dispatch(setAuthData({ accessToken: data.accessToken, userData: data.user }))
          } else {
            // Ошибка обновления (сессия пропала/истекла или сервер не отдал токен)
            api.dispatch(clearAuthData())
            toast.error("Сессия истекла. Пожалуйста, войдите снова.", { toastId: "err-401" })
          }
        } finally {
          isRefreshing = false
          refreshPromise = null
        }
      }

      refreshPromise = runRefresh()
      const ok = await waitRefreshSafe(refreshPromise, REFRESH_WAIT_TIMEOUT_MS)
      if (!ok) {
        isRefreshing = false
        refreshPromise = null
      }
    } else {
      // Другой запрос уже инициировал обновление токена, просто дождемся его
      if (refreshPromise) {
        const ok = await waitRefreshSafe(refreshPromise, REFRESH_WAIT_TIMEOUT_MS)
        if (!ok) {
          isRefreshing = false
          refreshPromise = null
        }
      }
    }

    const stateAfterRefresh = api.getState() as RootState
    const hasTokenAfterRefresh = Boolean(stateAfterRefresh.user?.accessToken)

    if (hasTokenAfterRefresh) {
      // После обновления токена повторяем исходный запрос
      result = await baseQueryWithAuth(args, api, extraOptions)
    } else {
      // Возвращаем 401, но без зависания запроса
      result = {
        error: {
          status: 401,
          data: { message: "Unauthorized" },
        },
      }
    }
  } else if (result.error) {
    const status = result.error.status
    if (status === 403) {
      const url = typeof args === "string" ? args : (args as FetchArgs).url
      console.warn("[403] Запрос без прав:", url)
      toast.error("Недостаточно прав для выполнения действия (403)", { toastId: "err-403" })
    } else if (status === 404) {
      toast.error("Запрашиваемый ресурс не найден (404)", { toastId: "err-404" })
    } else if (status === 413) {
      toast.error("Файл слишком велик. Пожалуйста, выберите файл меньшего размера.", { toastId: "err-413" })
    } else if (status === 503) {
      toast.error("Сервис временно недоступен (503). Попробуйте позже.", { toastId: "err-503" })
    } else if (status === 500 || status === "FETCH_ERROR" || status === "PARSING_ERROR") {
      toast.error("Произошла ошибка сервера или сети. Попробуйте позже.", { toastId: "err-500" })
    }
  }

  return result
}



/**
 * BaseQuery для API которые НЕ требуют аутентификации (например, authApi)
 * Перехватывает общие ошибки сети/сервера
 */
export const publicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await baseQueryPublic(args, api, extraOptions)

  if (result.error) {
    const status = result.error.status
    if (status === 413) {
      toast.error("Файл слишком велик. Пожалуйста, выберите файл меньшего размера.", { toastId: "err-413-public" })
    } else if (status === 503) {
      toast.error("Сервис временно недоступен (503). Попробуйте позже.", { toastId: "err-503-public" })
    } else if (status === 500 || status === "FETCH_ERROR" || status === "PARSING_ERROR") {
      toast.error("Произошла ошибка сервера или сети. Попробуйте позже.", { toastId: "err-500-public" })
    }
  }

  return result
}
