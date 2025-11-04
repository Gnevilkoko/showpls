import { createZodDto } from "nestjs-zod"
import { z } from "zod"
import { OrderValue, Role } from "@share"
import { ValidationService } from "../../../../common/validation"
import { paginationSchema } from "../../../../common/dto"

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

export class TONTopUpListDto extends createZodDto(schema) {}
