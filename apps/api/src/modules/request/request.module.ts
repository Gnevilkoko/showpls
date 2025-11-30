import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Request, Response, FileAttachment } from "@share/entities"
import { RequestController } from "./request.controller"
import { RequestService } from "./request.service"
import { LedgerModule } from "@ledger/ledger.module"
import { EscrowHoldService } from "@ledger/escrow/escrow-hold.service"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { Account, Balance, Currency, Entry, Settings, Transaction } from "@ledger/entities"
import { UserService } from "../user/user.service"
import { User } from "@share/entities"
import { ResponseModule } from "../response/response.module"

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, Response, FileAttachment, User, Account, Balance, Currency, Entry, Settings, Transaction]),
    LedgerModule,
    ResponseModule
  ],
  controllers: [RequestController],
  providers: [RequestService, UserService, EscrowHoldService, AccountService, BalanceService, CurrencyService],
  exports: [RequestService],
})
export class RequestModule {}