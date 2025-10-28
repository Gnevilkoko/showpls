import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { RootState } from "./index"

export interface UpdateLanguageRequest {
  language: "en" | "ru"
}

export interface UpdateLanguageResponse {
  success: boolean
  message?: string
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers, { getState }) => {
      // Получаем токен из состояния
      const state = getState() as RootState
      const token = state.user?.accessToken

      if (token) {
        headers.set("authorization", `Bearer ${token}`)
      }

      return headers
    },
  }),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    updateLanguage: builder.mutation<UpdateLanguageResponse, UpdateLanguageRequest>({
      query: (body) => ({
        url: "/user/set-language-code",
        method: "POST",
        body: { code: body.language },
      }),
      invalidatesTags: ["User"],
    }),
  }),
})

export const { useUpdateLanguageMutation } = userApi
