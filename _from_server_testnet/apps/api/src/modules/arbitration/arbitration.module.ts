import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Arbitration, Request, Deal, Chat, User } from "@share/entities"
import { ArbitrationController } from "./arbitration.controller"
import { ArbitrationService } from "./arbitration.service"
import { ChatModule } from "../chat/chat.module"
import { NotificationModule } from "../notification/notification.module"
import { LedgerModule } from "@ledger/ledger.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Arbitration, Request, Deal, Chat, User]),
    ChatModule,
    NotificationModule,
    LedgerModule,
  ],
  controllers: [ArbitrationController],
  providers: [ArbitrationService],
  exports: [ArbitrationService],
})
export class ArbitrationModule {}