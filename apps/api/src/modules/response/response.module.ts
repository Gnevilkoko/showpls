import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Response, Request, Deal } from "@share/entities"
import { ResponseController } from "./response.controller"
import { ResponseService } from "./response.service"
import { ChatModule } from "../chat/chat.module"
import { NotificationModule } from "../notification/notification.module"

@Module({
  imports: [TypeOrmModule.forFeature([Response, Request, Deal]), ChatModule, NotificationModule],
  controllers: [ResponseController],
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseModule {}