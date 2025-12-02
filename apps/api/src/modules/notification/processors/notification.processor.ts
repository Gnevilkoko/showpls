import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { Logger } from "@nestjs/common"
import { ChatGateway } from "../../chat/chat.gateway"
import { InjectRepository } from "@nestjs/typeorm"
import { Notification } from "../notification.entity"
import { Repository } from "typeorm"
import { User } from "@share/entities/user.entity"

@Processor("notify-user")
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name)

  constructor(
    private readonly chatGateway: ChatGateway,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super()
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, eventType, payload } = job.data
    this.logger.log(`Processing notification for user ${userId}: ${eventType}`)

    try {
      // 1. Check WebSocket
      const isConnected = this.chatGateway.isUserConnected(userId)

      if (isConnected) {
        this.logger.log(`User ${userId} is online. Sending WebSocket event.`)
        this.chatGateway.sendNotification(userId, {
          type: eventType,
          ...payload,
        })
      } else {
        // 3. If Offline (or always): Log "Sending Push Notification via FCM..."
        this.logger.log(`User ${userId} is offline. Sending Push Notification via FCM...`)
        // Mock FCM call
      }

      // 4. Persistence
      const user = await this.userRepository.findOne({ where: { id: userId } })
      if (user) {
        const notification = this.notificationRepository.create({
          user,
          type: eventType,
          text: payload.text || `Notification: ${eventType}`, // Fallback text
          payload,
          isRead: false,
        })
        await this.notificationRepository.save(notification)
      }
    } catch (error) {
      this.logger.error(`Failed to process notification for user ${userId}`, (error as Error).stack)
      throw error
    }
  }
}