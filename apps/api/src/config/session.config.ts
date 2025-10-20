import ms from "ms"
import process from "node:process"
import { z } from "zod"

export default function () {
  const schema = z.object({
    secret: z.string().min(32).max(256), // use 32 bytes (64 chars)
  })
  return {
    ...schema.parse({
      secret: process.env.SESSION_SECRET,
    }),
    maxAge: ms("15 days"),
  }
}
