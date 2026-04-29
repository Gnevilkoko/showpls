import { z } from "zod"
import { createZodDto } from "nestjs-zod"

const markReadSchema = z.object({
  messageIds: z.array(z.string()).optional(),
})

export class MarkReadDto extends createZodDto(markReadSchema) {}