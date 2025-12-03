import { Injectable } from "@nestjs/common"
import { InjectQueue } from "@nestjs/bullmq"
import { Queue } from "bullmq"

@Injectable()
export class NotificationService {
  constructor(@InjectQueue("notify-user") private notificationQueue: Queue) {}

  async send(userId: string, eventType: string, payload: any) {
    // Создаем идемпотентный ключ на основе userId, eventType и хеша payload
    const crypto = require('crypto')
    const payloadHash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')
    const jobId = `${userId}-notify-${eventType}-${payloadHash}`
    
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
        // Добавляем опцию для предотвращения дублирования
        removeOnFail: false,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    )
  }
}