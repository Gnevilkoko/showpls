import { z } from "zod"
import { createZodDto } from "nestjs-zod"

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
