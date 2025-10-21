import * as process from "node:process"
import { z } from "zod"

export default function () {
  return z
    .object({
      token: z.string().min(10),
    })
    .parse({
      token: process.env.TG_BOT_TOKEN,
    })
}
