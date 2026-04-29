import { z } from "zod"
import { LanguageCode } from "@share"
import { createZodDto } from "nestjs-zod"

const schema = z.object({
  code: z.enum(LanguageCode),
})

export class SetLanguageCodeDto extends createZodDto(schema) {}
