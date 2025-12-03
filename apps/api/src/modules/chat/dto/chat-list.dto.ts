import { z } from "zod"
import { createZodDto } from "nestjs-zod"
import { paginationSchema } from "../../../common/dto/pagination.dto"

const chatListSchema = paginationSchema.extend({
  isFavorite: z
    .preprocess((val) => {
      if (typeof val === "string") return val === "true"
      return val
    }, z.boolean().optional()),
  search: z.string().optional(),
})

export class ChatListDto extends createZodDto(chatListSchema) {}