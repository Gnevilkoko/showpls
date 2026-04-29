import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { UserDataType } from "../../shared/types"
import type { PerformerListGeoItem, UserReviewBackend, TransactionBackend } from "../../shared/types/backend"

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

export interface GetTransactionsParams {
  limit?: number
  offset?: number
}

export interface GetTransactionsResponse {
  items: TransactionBackend[]
  total: number
}

export type UserProfileResponse = UserDataType & {
  rating: number
  reviewsCount: number
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string | null
  avatar?: string | null
  about?: string | null
  city?: string | null
}

export interface SubmitPerformerVerificationRequest {
  latitude: number
  longitude: number
  accuracyM?: number | null
  os: "ios" | "android" | "web"
  osVersion: string
  deviceModel: string
  userAgent: string
}

export interface SubmitPerformerVerificationResponse {
  performerVerification: Record<string, unknown>
}

export interface UpdateUserLocationRequest {
  latitude: number
  longitude: number
}

export interface PatchPerformerVerificationGeoRequest {
  latitude: number
  longitude: number
  accuracyM?: number | null
}

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["User", "Balances", "Reviews", "PerformersMap"],
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
    getTransactions: builder.query<GetTransactionsResponse, GetTransactionsParams | void>({
      query: (params = {}) => ({
        url: "/user/transactions",
        params: { limit: params?.limit ?? 20, offset: params?.offset ?? 0 },
      }),
      providesTags: ["Balances"],
    }),
    getMe: builder.query<UserProfileResponse, void>({
      query: () => ({
        url: "/user/get-me",
      }),
      providesTags: ["User"],
    }),
    listPerformers: builder.query<
      PerformerListGeoItem[],
      { latitude: number; longitude: number; radiusKm: number }
    >({
      query: (params) => ({
        url: "/user/list-performers",
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          radiusKm: params.radiusKm,
        },
      }),
    }),
    /** Все исполнители «готов к работе» с геометкой (до limit) — для карты мира */
    listPerformersOnMap: builder.query<PerformerListGeoItem[], void>({
      query: () => ({
        url: "/user/list-performers-map",
        params: { limit: 2000 },
      }),
      providesTags: ["PerformersMap"],
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }),
    updateProfile: builder.mutation<UserProfileResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: "/user/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    submitPerformerVerification: builder.mutation<SubmitPerformerVerificationResponse, SubmitPerformerVerificationRequest>({
      query: (body) => ({
        url: "/user/performer-verification",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    toggleAvailable: builder.mutation<{ isAvailable: boolean }, void>({
      query: () => ({
        url: "/user/toggle-available",
        method: "PATCH",
      }),
      invalidatesTags: ["User", "PerformersMap"],
    }),
    updateUserLocation: builder.mutation<{ success: boolean }, UpdateUserLocationRequest>({
      query: (body) => ({
        url: "/user/update-location",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "PerformersMap"],
    }),
    patchPerformerVerificationGeo: builder.mutation<
      SubmitPerformerVerificationResponse,
      PatchPerformerVerificationGeoRequest
    >({
      query: (body) => ({
        url: "/user/performer-verification-geo",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["User", "PerformersMap"],
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

export const {
  useUpdateLanguageMutation,
  useGetBalancesQuery,
  useLazyGetBalancesQuery,
  useGetTransactionsQuery,
  useGetMeQuery,
  useListPerformersQuery,
  useListPerformersOnMapQuery,
  useGetReviewsQuery,
  useUpdateProfileMutation,
  useSubmitPerformerVerificationMutation,
  useToggleAvailableMutation,
  useUpdateUserLocationMutation,
  usePatchPerformerVerificationGeoMutation,
} = userApi

// Экспортируем endpoints для использования в thunks (например, в languageSlice)
export const userApiEndpoints = {
  updateLanguage: userApi.endpoints.updateLanguage,
  getBalances: userApi.endpoints.getBalances,
  getMe: userApi.endpoints.getMe,
  getReviews: userApi.endpoints.getReviews,
}
