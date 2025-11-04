import { paginationSchema } from "../../../common/dto"
import { z } from "zod"
import { ValidationService } from "../../../common/validation"
import { OrderValue } from "@share"
import { createZodDto } from "nestjs-zod"

const schema = paginationSchema.extend({
  filter: z
    .object({
      txid: z.string().min(1).optional(),
      paid: ValidationService.getZodBooleanValidator(true),
      userId: z.coerce.number().int().positive().transform(String).optional(),
    })
    .default({
      paid: undefined
    }),
  sort: z
    .object({
      createdAt: z.enum(OrderValue).optional(),
      amount: z.enum(OrderValue).optional(),
    })
    .default({}),
})

export class TopUpListDto extends createZodDto(schema) {}
