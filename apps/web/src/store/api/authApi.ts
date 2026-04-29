import { createApi } from "@reduxjs/toolkit/query/react"
import type { UserDataType } from "../../shared/types"
import { publicBaseQuery } from "./baseQuery"

export interface AuthRequest {
  type: "tg-mini-app" | "tg-login-widget"
  payload: string | object
}

export interface AuthResponse {
  accessToken: string
  user: UserDataType
  /** JWT для deep link showpls://auth/callback?code=… и веб /auth/callback?code=… */
  authCallbackCode?: string
}

export interface ExchangeCallbackCodeRequest {
  code: string
}

export interface PhoneInitRequest {
  phone: string
}

export interface PhoneInitResponse {
  status: boolean
  ucallerId: number
}

export interface PhoneVerifyRequest {
  phone: string
  code: string
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: publicBaseQuery,
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    signIn: builder.mutation<AuthResponse, AuthRequest>({
      query: (body) => ({
        url: "/auth/sign-in",
        method: "POST",
        body,
      }),
    }),

    phoneInit: builder.mutation<PhoneInitResponse, PhoneInitRequest>({
      query: (body) => ({
        url: "/auth/phone/init",
        method: "POST",
        body,
      }),
    }),

    phoneVerify: builder.mutation<AuthResponse, PhoneVerifyRequest>({
      query: (body) => ({
        url: "/auth/phone/verify",
        method: "POST",
        body,
      }),
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/sign-out",
        method: "POST",
      }),
    }),

    exchangeCallbackCode: builder.mutation<AuthResponse, ExchangeCallbackCodeRequest>({
      query: (body) => ({
        url: "/auth/exchange-callback-code",
        method: "POST",
        body,
      }),
    }),
  }),
})

export const {
  useSignInMutation,
  usePhoneInitMutation,
  usePhoneVerifyMutation,
  useSignOutMutation,
  useExchangeCallbackCodeMutation,
} = authApi
