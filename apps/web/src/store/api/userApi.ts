import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"

export interface UpdateLanguageRequest {
  language: "en" | "ru"
}

export interface UpdateLanguageResponse {
  success: boolean
  message?: string
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    updateLanguage: builder.mutation<UpdateLanguageResponse, UpdateLanguageRequest>({
      query: (body: UpdateLanguageRequest) => ({
        url: "/user/set-language-code",
        method: "POST",
        body: { code: body.language },
      }),
      invalidatesTags: ["User"],
    }),
  }),
})

export const { useUpdateLanguageMutation } = userApi

// Экспортируем endpoints для использования в thunks (например, в languageSlice)
export const userApiEndpoints = {
  updateLanguage: userApi.endpoints.updateLanguage,
}
