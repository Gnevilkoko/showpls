import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Deal, FileAttachment, Request, Response, Submission } from "@share/entities"
import { SubmissionController } from "./submission.controller"
import { SubmissionService } from "./submission.service"
import { NotificationModule } from "../notification/notification.module"
import { ChatModule } from "../chat/chat.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, FileAttachment, Request, Deal, Response]),
    NotificationModule,
    ChatModule,
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService],
  exports: [SubmissionService],
})
export class SubmissionModule {}