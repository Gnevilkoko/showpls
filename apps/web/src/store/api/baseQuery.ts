import { fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from "@reduxjs/toolkit/query/react"
import { toast } from "react-toastify"
import type { RootState } from "../index"
import { clearAuthData, setAuthData } from "../userSlice"

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: "/api",
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
})

let isRefreshing = false
let refreshPromise: Promise<unknown> | null = null

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
  // Если сейчас идет обновление токена, ждем завершения
  if (isRefreshing && refreshPromise) {
    await refreshPromise
  }

  let result = await baseQueryWithAuth(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
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

            // Повторяем оригинальный запрос с новым токеном
            result = await baseQueryWithAuth(args, api, extraOptions)
          } else {
            // Ошибка обновления
            api.dispatch(clearAuthData())
            toast.error("Сессия истекла. Пожалуйста, войдите снова.", { toastId: "err-401" })
          }
        } finally {
          isRefreshing = false
          refreshPromise = null
        }
      }

      refreshPromise = runRefresh()
      await refreshPromise
    } else {
      // Другой запрос уже инициировал обновление токена, просто дождемся его
      if (refreshPromise) {
        await refreshPromise
      }
      // После обновления токена, повторяем наш запрос
      result = await baseQueryWithAuth(args, api, extraOptions)
    }
  } else if (result.error) {
    const status = result.error.status
    if (status === 403) {
      toast.error("Недостаточно прав для выполнения действия (403)", { toastId: "err-403" })
    } else if (status === 404) {
      toast.error("Запрашиваемый ресурс не найден (404)", { toastId: "err-404" })
    } else if (status === 413) {
      toast.error("Файл слишком велик. Пожалуйста, выберите файл меньшего размера.", { toastId: "err-413" })
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
    } else if (status === 500 || status === "FETCH_ERROR" || status === "PARSING_ERROR") {
      toast.error("Произошла ошибка сервера или сети. Попробуйте позже.", { toastId: "err-500-public" })
    }
  }

  return result
}
