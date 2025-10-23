import { OrderValue, Role } from "@share"
import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { paginationSchema } from "../../../common/dto"

const schema = paginationSchema.extend({
  filter: z
    .object({
      id: z.coerce.number().int().positive().transform(String).optional(),
      tgId: z.coerce.number().int().transform(String).optional(),
      role: z.enum(Role).optional(),
    })
    .default({}),
  sort: z
    .object({
      createdAt: z.enum(OrderValue).optional(),
    })
    .default({
      createdAt: OrderValue.DESC
    }),
})

export class UserListDto extends createZodDto(schema) {}

