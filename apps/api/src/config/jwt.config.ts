import * as process from "node:process"
import { z } from "zod"

export default function () {
  const schema = z.object({
    privateKey: z.preprocess(
      (v: any) => v.replace(/(\r\n|\n|\r)/gm, ""),
      z
        .string()
        .trim()
        .base64()
        .transform((base64) => Buffer.from(base64, "base64").toString("utf-8")),
    ),
    publicKey: z.preprocess(
      (v: any) => v.replace(/(\r\n|\n|\r)/gm, ""),
      z
        .string()
        .trim()
        .base64()
        .transform((base64) => Buffer.from(base64, "base64").toString("utf-8")),
    ),
  })
  return schema.parse({
    privateKey: process.env.JWT_SECRET_KEY,
    publicKey: process.env.JWT_PUBLIC_KEY,
  })
}
