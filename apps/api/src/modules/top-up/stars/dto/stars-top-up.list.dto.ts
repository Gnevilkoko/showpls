import { createZodDto } from "nestjs-zod"
import { paginationSchema } from "../../../../common/dto"
import { z } from "zod"
import { OrderValue, Role } from "@share"
import { ValidationService } from "../../../../common/validation"

const schema = paginationSchema.extend({
  filter: z
    .object({
      txid: z.string().min(1).optional(),
      paid: ValidationService.getZodBooleanValidator(true),
      refunded: ValidationService.getZodBooleanValidator(true),
      userId: z.coerce.number().int().positive().transform(String).optional(),
    })
    .default({
      refunded: undefined,
      paid: undefined
    }),
  sort: z
    .object({
      createdAt: z.enum(OrderValue).optional(),
      amount: z.enum(OrderValue).optional(),
    })
    .default({}),
})

export class StarsTopUpListDto extends createZodDto(schema) {}
