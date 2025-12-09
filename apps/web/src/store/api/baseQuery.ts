import { fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "../index"

/**
 * Общий baseQuery конфиг для всех API которые требуют аутентификации
 * Используется в userApi, requestApi, chatApi и т.д.
 */
export const authenticatedBaseQuery = fetchBaseQuery({
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

/**
 * BaseQuery для API которые НЕ требуют аутентификации (например, authApi)
 */
export const publicBaseQuery = fetchBaseQuery({
  baseUrl: "/api",
})
