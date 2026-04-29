import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Deal, Request, Response } from "@share/entities"
import { DealController } from "./deal.controller"
import { DealService } from "./deal.service"
import { ChatModule } from "../chat/chat.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal, Request, Response]),
    ChatModule,
  ],
  controllers: [DealController],
  providers: [DealService],
  exports: [DealService],
})
export class DealModule {}