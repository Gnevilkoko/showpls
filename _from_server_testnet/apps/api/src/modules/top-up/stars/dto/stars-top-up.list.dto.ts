import { createZodDto } from "nestjs-zod"
import { paginationSchema } from "../../../../common/dto"
import { z } from "zod"
import { OrderValue } from "@share"

const schema = paginationSchema.extend({
  filter: z
    .object({
      txid: z.string().min(1).optional(),
      paid: z.union([z.stringbool(), z.boolean()]).optional(),
      refunded: z.union([z.stringbool(), z.boolean()]).optional(),
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

export class StarsTopUpListDto extends createZodDto(schema) {}
