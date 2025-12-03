import { z } from "zod"
import { createZodDto } from "nestjs-zod"

const sendMessageSchema = z.object({
  text: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  type: z.enum(["message", "notification"]).default("message").optional(),
  variant: z.string().optional(),
})

export class SendMessageDto extends createZodDto(sendMessageSchema) {}