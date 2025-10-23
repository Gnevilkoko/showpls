import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { UserDataType } from "../shared/types"

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
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
  }),
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    signIn: builder.mutation<AuthResponse, AuthRequest>({
      query: (body) => ({
        url: "/auth/sign-in",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
})

export const { useSignInMutation } = authApi
