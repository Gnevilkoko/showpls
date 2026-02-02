import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"

export interface UpdateLanguageRequest {
  language: "en" | "ru"
}

export interface UpdateLanguageResponse {
  success: boolean
  message?: string
}

export interface Balance {
  token: string
  blockchain: string | null
  balance: string
  lockedBalance: string
}

export interface GetBalancesRequest {
  id: string
}

export type GetBalancesResponse = Balance[]

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["User", "Balances"],
  endpoints: (builder) => ({
    updateLanguage: builder.mutation<UpdateLanguageResponse, UpdateLanguageRequest>({
      query: (body: UpdateLanguageRequest) => ({
        url: "/user/set-language-code",
        method: "POST",
        body: { code: body.language },
      }),
      invalidatesTags: ["User"],
    }),
    getBalances: builder.query<GetBalancesResponse, GetBalancesRequest>({
      query: ({ id }) => ({
        url: "/user/get-balances",
        params: { id },
      }),
      providesTags: ["Balances"],
    }),
  }),
})

export const { useUpdateLanguageMutation, useGetBalancesQuery, useLazyGetBalancesQuery } = userApi

// Экспортируем endpoints для использования в thunks (например, в languageSlice)
export const userApiEndpoints = {
  updateLanguage: userApi.endpoints.updateLanguage,
  getBalances: userApi.endpoints.getBalances,
}
