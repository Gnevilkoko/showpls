import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { TONUtilities } from "../ton.utilities"
import { Address } from "@ton/ton"

const schema = z.object({
  holder: z
    .string()
    .trim()
    .refine((v) => {
      try {
        Address.parse(v)
        return true
      } catch (e) {
        return false
      }
    }, "Invalid TON address")
    .transform(TONUtilities.standardizeAddress),
})

export class GetJettonWalletDto extends createZodDto(schema) {}
