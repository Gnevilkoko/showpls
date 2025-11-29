import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Deal, Request, Response } from "@share/entities"
import { DealController } from "./deal.controller"
import { DealService } from "./deal.service"
import { LedgerModule } from "@ledger/ledger.module"
import { EscrowHoldService } from "@ledger/escrow/escrow-hold.service"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { Account, Balance, Currency, Entry, Settings, Transaction } from "@ledger/entities"

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal, Request, Response, Account, Balance, Currency, Entry, Settings, Transaction]),
    LedgerModule
  ],
  controllers: [DealController],
  providers: [DealService, EscrowHoldService, AccountService, BalanceService, CurrencyService],
  exports: [DealService],
})
export class DealModule {}