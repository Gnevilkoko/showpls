import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationService } from "./notification.service"
import { NotificationController } from "./notification.controller"
import { NotificationProcessor } from "./processors/notification.processor"
import { Notification } from "./notification.entity"
import { ChatModule } from "../chat/chat.module"
import { QueueModule } from "../queue/queue.module"
import { DeviceModule } from "../device/device.module"
import { User } from "@share/entities/user.entity"

@Module({
  imports: [
    BullModule.registerQueue({
      name: "notify-user",
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    }),
    TypeOrmModule.forFeature([Notification, User]),
    QueueModule,
    ChatModule,
    DeviceModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}