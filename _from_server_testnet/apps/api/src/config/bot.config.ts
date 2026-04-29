import * as process from "node:process"
import { z } from "zod"

export default function () {
  return z
    .object({
      token: z.string().min(10),
      webhookPath: z.string().min(32)
    })
    .parse({
      token: process.env.TG_BOT_TOKEN,
      webhookPath: process.env.TG_WEBHOOK_SECRET_PATH
    })
}
