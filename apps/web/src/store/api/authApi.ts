import { createApi } from "@reduxjs/toolkit/query/react"
import type { UserDataType } from "../../shared/types"
import { NotificationHandler } from "../../shared/utils/notificationHandler"
import { publicBaseQuery } from "./baseQuery"

export interface AuthRequest {
  type: "tg-mini-app" | "tg-login-widget"
  payload: string | object
}

export interface AuthResponse {
  accessToken: string
  user: UserDataType
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: publicBaseQuery, // Используем publicBaseQuery (без токена)
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    signIn: builder.mutation<AuthResponse, AuthRequest>({
      query: (body) => ({
        url: "/auth/sign-in",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
      // Обработка ошибок на уровне мутации
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled
        } catch (error) {
          NotificationHandler.handleError(error)
        }
      },
    }),
  }),
})

export const { useSignInMutation } = authApi
