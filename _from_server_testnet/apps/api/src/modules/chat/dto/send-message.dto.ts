import { z } from "zod"
import { createZodDto } from "nestjs-zod"

const sendMessageSchema = z.object({
  text: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  type: z.enum(["message", "notification"]).default("message").optional(),
  variant: z
    .enum([
      "upload",
      "newTask",
      "newOffer",
      "permissionToCancel",
      "taskCompleted",
      "taskCancelled",
      "responseAccepted",
      "submissionRejected",
    ])
    .nullable()
    .optional(),
  requestId: z.string().uuid().optional(),
  responseId: z.string().uuid().optional(),
  asSupport: z.boolean().optional(),
})

export class SendMessageDto extends createZodDto(sendMessageSchema) {}
