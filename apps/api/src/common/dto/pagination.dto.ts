import { z } from "zod"
import { createZodDto } from "nestjs-zod"

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1),
  limit: z.coerce.number().int().min(1).max(150),
})

export class PaginationDto extends createZodDto(paginationSchema) {}
