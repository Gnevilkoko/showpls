import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Request, Response, FileAttachment, Submission, Deal } from "@share/entities"
import { RequestController } from "./request.controller"
import { RequestService } from "./request.service"
import { LedgerModule } from "@ledger/ledger.module"
import { EscrowHoldService } from "@ledger/escrow/escrow-hold.service"
import { EscrowReleaseService } from "@ledger/escrow/escrow-release.service"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { Account, Balance, Currency, Entry, Settings, Transaction } from "@ledger/entities"
import { UserService } from "../user/user.service"
import { User } from "@share/entities"
import { ResponseModule } from "../response/response.module"
import { BullModule } from '@nestjs/bullmq'
import { QueueModule } from "../queue/queue.module"
import { GeoModule } from "../geo/geo.module"
import { ChatModule } from "../chat/chat.module"
import { NotificationModule } from "../notification/notification.module"
import { ChatGateway } from "../chat/chat.gateway"

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Response, FileAttachment, Submission, Deal, User, Account, Balance, Currency, Entry, Settings, Transaction]),
    LedgerModule,
    ResponseModule,
    QueueModule,
    GeoModule,
    ChatModule,
    NotificationModule,
  ],
  controllers: [RequestController],
  providers: [RequestService, UserService, EscrowHoldService, EscrowReleaseService, AccountService, BalanceService, CurrencyService, ChatGateway],
  exports: [RequestService],
})
export class RequestModule {}