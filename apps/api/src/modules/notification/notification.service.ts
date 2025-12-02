import { Injectable } from "@nestjs/common"
import { InjectQueue } from "@nestjs/bullmq"
import { Queue } from "bullmq"

@Injectable()
export class NotificationService {
  constructor(@InjectQueue("notify-user") private notificationQueue: Queue) {}

  async send(userId: string, eventType: string, payload: any) {
    const jobId = `${userId}-notify-${eventType}-${Date.now()}`
    await this.notificationQueue.add(
      "notify",
      {
        userId,
        eventType,
        payload,
      },
      {
        jobId,
        removeOnComplete: true,
      },
    )
  }
}