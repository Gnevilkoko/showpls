import { z } from "zod"
import { createZodDto } from "nestjs-zod"


const schema = z.object({
  amount: z.coerce.number().int().positive()
})

export class CreateStarsTopUpDto extends createZodDto(schema) {}
