import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"
import { TypeOrmModule } from "@nestjs/typeorm"
import { NotificationService } from "./notification.service"
import { NotificationProcessor } from "./processors/notification.processor"
import { Notification } from "./notification.entity"
import { ChatModule } from "../chat/chat.module"
import { User } from "@share/entities/user.entity"

@Module({
  imports: [
    BullModule.registerQueue({
      name: "notify-user",
    }),
    TypeOrmModule.forFeature([Notification, User]),
    ChatModule,
  ],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}