import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectQueue } from "@nestjs/bullmq"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Queue } from "bullmq"
import { Notification } from "./notification.entity"

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue("notify-user") private notificationQueue: Queue,
    @InjectRepository(Notification) private readonly notificationRepository: Repository<Notification>,
  ) {}

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

  async findAll(userId: string, query: { limit?: number; offset?: number }) {
    const limit = query.limit || 20
    const offset = query.offset || 0

    const [items, total] = await this.notificationRepository.findAndCount({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    })

    const countUnread = await this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    })

    return {
      items: items.map(n => ({
        id: n.id,
        text: n.text,
        type: n.type,
        variant: n.variant,
        payload: n.payload,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      total,
      countUnread,
    }
  }

  async markRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
    })

    if (!notification) {
      throw new NotFoundException("Notification not found")
    }

    notification.isRead = true
    await this.notificationRepository.save(notification)

    return { id: notification.id, isRead: true }
  }

  async markAllRead(userId: string) {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    )
    return { success: true }
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { user: { id: userId }, isRead: false },
    })
  }
}