import { z } from "zod"

export const SignInSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("tg-login-widget"),
    payload: z.record(z.string(), z.any()),
  }),
  z.object({
    type: z.literal("tg-mini-app"),
    payload: z.string().nonempty(),
  }),
])

export type SignInDto = z.infer<typeof SignInSchema>

export const PhoneInitSchema = z.object({
  phone: z.string().min(10).max(15),
})

export type PhoneInitDto = z.infer<typeof PhoneInitSchema>

export const PhoneVerifySchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(4),
})

export type PhoneVerifyDto = z.infer<typeof PhoneVerifySchema>

export const AuthCallbackSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("telegram"),
    type: z.enum(["tg-login-widget", "tg-mini-app"]),
    payload: z.any(),
  }),
  z.object({
    method: z.literal("phone"),
    phone: z.string().min(10).max(15),
    code: z.string().length(4),
  }),
])

export type AuthCallbackDto = z.infer<typeof AuthCallbackSchema>

export const ExchangeCallbackCodeSchema = z.object({
  code: z.string().min(20).max(8192),
})

export type ExchangeCallbackCodeDto = z.infer<typeof ExchangeCallbackCodeSchema>
