import { z } from "zod"
import { createZodDto } from "nestjs-zod"


const schema = z.object({
  amount: z.coerce.number().int().positive().min(1).max(10000)
})

export class CreateStarsTopUpDto extends createZodDto(schema) {}
