import { z } from "zod"
import { createZodDto } from "nestjs-zod"

const toggleFavoriteSchema = z.object({
  isFavorite: z.boolean(),
})

export class ToggleFavoriteDto extends createZodDto(toggleFavoriteSchema) {}