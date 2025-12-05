import { Processor } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { Injectable } from "@nestjs/common"
import { ChatGateway } from "../../chat/chat.gateway"
import { InjectRepository } from "@nestjs/typeorm"
import { Notification } from "../notification.entity"
import { Repository } from "typeorm"
import { User } from "@share/entities/user.entity"
import { BaseProcessor } from "../../queue/base/base-processor"

@Processor("notify-user")
@Injectable()
export class NotificationProcessor extends BaseProcessor {
  constructor(
    private readonly chatGateway: ChatGateway,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(NotificationProcessor.name)
  }

  async processJob(job: Job<any, any, string>): Promise<any> {
    const { userId, eventType, payload } = job.data

    this.logger.log(`Processing notification for user ${userId}: ${eventType}`)

    // 1. Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping notification`)
      return { skipped: true, reason: 'User not found' }
    }

    // 2. Check WebSocket connection with error handling
    let websocketSent = false
    try {
      const isConnected = this.chatGateway.isUserConnected(userId)

      if (isConnected) {
        this.logger.log(`User ${userId} is online. Sending WebSocket event.`)
        this.chatGateway.sendNotification(userId, {
          type: eventType,
          ...payload,
        })
        websocketSent = true
      } else {
        this.logger.log(`User ${userId} is offline. Will try push notification.`)
      }
    } catch (wsError) {
      this.logger.error(
        `Failed to send WebSocket notification to user ${userId}: ${wsError instanceof Error ? wsError.message : 'Unknown WebSocket error'}`,
        wsError instanceof Error ? wsError.stack : undefined,
      )
    }

    // 3. Try push notification if WebSocket failed or user is offline
    if (!websocketSent) {
      try {
        this.logger.log(`Sending Push Notification via FCM for user ${userId}...`)
        // Mock FCM call - в реальном проекте здесь будет интеграция с FCM
        // await this.fcmService.sendNotification(userId, { type: eventType, ...payload })
        this.logger.log(`Push notification sent to user ${userId}`)
      } catch (fcmError) {
        this.logger.error(
          `Failed to send push notification to user ${userId}: ${fcmError instanceof Error ? fcmError.message : 'Unknown FCM error'}`,
          fcmError instanceof Error ? fcmError.stack : undefined,
        )
        // Не прерываем выполнение, продолжаем с сохранением в БД
      }
    }

    // 4. Persistence with error handling
    try {
      const notification = this.notificationRepository.create({
        user,
        type: payload.type || "notification", // Default to "notification" if not specified
        variant: payload.variant || null, // New field for variant
        text: payload.text || `Notification: ${eventType}`, // Fallback text
        payload,
        isRead: false,
      })
      await this.notificationRepository.save(notification)
      this.logger.log(`Notification saved to database for user ${userId}`)
    } catch (dbError) {
      this.logger.error(
        `Failed to save notification to database for user ${userId}: ${dbError instanceof Error ? dbError.message : 'Unknown DB error'}`,
        dbError instanceof Error ? dbError.stack : undefined,
      )
      // Пробрасываем ошибку, так как сохранение в БД критично
      throw dbError
    }

    return {
      success: true,
      userId,
      eventType,
      websocketSent,
      pushNotificationSent: !websocketSent,
      savedToDatabase: true,
    }
  }

  /**
   * Отправка уведомления администратору о критических ошибках
   */
  protected async sendAdminAlert(message: string): Promise<void> {
    this.logger.error(`ADMIN ALERT: ${message}`)
    // В реальном проекте здесь может быть интеграция с системой уведомлений
    // await this.notificationService.sendAdminAlert(message)
  }
}