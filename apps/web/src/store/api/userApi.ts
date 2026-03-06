import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { UserDataType } from "../../shared/types"
import type { UserReviewBackend } from "../../shared/types/backend"

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

export type UserProfileResponse = UserDataType & {
  rating: number
  reviewsCount: number
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["User", "Balances", "Reviews"],
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
    getMe: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: "/user/get-me",
      }),
      providesTags: ["User"],
    }),
    getReviews: builder.query<UserReviewBackend[], string | void>({
      query: (id) => ({
        url: "/user/reviews",
        params: id ? { id } : undefined,
      }),
      providesTags: ["Reviews"],
    }),
  }),
})

export const { useUpdateLanguageMutation, useGetBalancesQuery, useLazyGetBalancesQuery, useGetMeQuery, useGetReviewsQuery } =
  userApi

// Экспортируем endpoints для использования в thunks (например, в languageSlice)
export const userApiEndpoints = {
  updateLanguage: userApi.endpoints.updateLanguage,
  getBalances: userApi.endpoints.getBalances,
  getMe: userApi.endpoints.getMe,
  getReviews: userApi.endpoints.getReviews,
}
