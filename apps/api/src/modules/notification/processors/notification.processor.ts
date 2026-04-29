import { Processor } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { Injectable } from "@nestjs/common"
import { ChatGateway } from "../../chat/chat.gateway"
import { InjectRepository } from "@nestjs/typeorm"
import { Notification } from "../notification.entity"
import { Repository } from "typeorm"
import { User } from "@share/entities/user.entity"
import { BaseProcessor } from "../../queue/base/base-processor"
import { DeviceService } from "../../device/device.service"
import { type PushPayload, buildPushPayload, PushNotificationType } from "../push-payload"

@Processor("notify-user")
@Injectable()
export class NotificationProcessor extends BaseProcessor {
  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly deviceService: DeviceService,
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

    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      this.logger.warn(`User ${userId} not found, skipping notification`)
      return { skipped: true, reason: "User not found" }
    }

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
        `Failed to send WebSocket notification to user ${userId}: ${wsError instanceof Error ? wsError.message : "Unknown WebSocket error"}`,
        wsError instanceof Error ? wsError.stack : undefined,
      )
    }

    if (!websocketSent) {
      await this.sendPushToDevices(userId, eventType, payload)
    }

    try {
      const notification = this.notificationRepository.create({
        user,
        type: payload.type || "notification",
        variant: payload.variant || null,
        text: payload.text || `Notification: ${eventType}`,
        payload,
        isRead: false,
      })
      await this.notificationRepository.save(notification)
      this.logger.log(`Notification saved to database for user ${userId}`)
    } catch (dbError) {
      this.logger.error(
        `Failed to save notification to database for user ${userId}: ${dbError instanceof Error ? dbError.message : "Unknown DB error"}`,
        dbError instanceof Error ? dbError.stack : undefined,
      )
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

  private async sendPushToDevices(userId: string, eventType: string, payload: any): Promise<void> {
    try {
      const devices = await this.deviceService.getActiveTokens(userId)
      if (devices.length === 0) {
        this.logger.log(`No active push tokens for user ${userId}`)
        return
      }

      const pushPayload: PushPayload = buildPushPayload({
        title: payload.pushTitle || payload.title || "Showpls",
        body: payload.pushBody || payload.text || `Notification: ${eventType}`,
        type: (payload.pushType as PushNotificationType) || PushNotificationType.SYSTEM,
        entityId: payload.entityId || null,
        imageUrl: payload.imageUrl || null,
      })

      this.logger.log(`Prepared push payload for ${devices.length} device(s): ${JSON.stringify(pushPayload)}`)

      for (const device of devices) {
        try {
          this.logger.log(`Push → ${device.platform}/${device.deviceId}: token=${device.pushToken.slice(0, 12)}...`)
          // FCM/APNs integration point:
          // await this.fcmService.send(device.pushToken, device.platform, pushPayload)
        } catch (pushErr) {
          this.logger.error(
            `Failed to send push to device ${device.deviceId}: ${pushErr instanceof Error ? pushErr.message : "Unknown"}`,
          )
          if (pushErr instanceof Error && pushErr.message.includes("NotRegistered")) {
            await this.deviceService.deactivateToken(device.pushToken)
          }
        }
      }
    } catch (err) {
      this.logger.error(
        `Failed to send push notifications to user ${userId}: ${err instanceof Error ? err.message : "Unknown"}`,
      )
    }
  }

  protected async sendAdminAlert(message: string): Promise<void> {
    this.logger.error(`ADMIN ALERT: ${message}`)
  }
}