import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { OrderValue } from "@share"
import { paginationSchema } from "../../../../common/dto"

const schema = paginationSchema.extend({
  filter: z
    .object({
      txid: z.string().min(1).optional(),
      paid: z.union([z.stringbool(), z.boolean()]).optional(),
      userId: z.coerce.number().int().positive().transform(String).optional(),
    })
    .default({}),
  sort: z
    .object({
      createdAt: z.enum(OrderValue).optional(),
      amount: z.enum(OrderValue).optional(),
    })
    .default({}),
})

export class TONTopUpListDto extends createZodDto(schema) {}
