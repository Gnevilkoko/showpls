import { DynamicModule, ModuleMetadata } from "@nestjs/common"
import { Ledger } from "./ledger"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm"
import { Account, Balance, Currency, Entry, Settings, Transaction } from "@ledger/entities"
import { DataSource } from "typeorm"

export class LedgerModule {
  public static forRootAsync({initialize}: LedgerModuleAsyncOptions = {}): DynamicModule {


    return {
      module: LedgerModule,
      global: true,
      imports: [TypeOrmModule.forFeature([Account, Balance, Currency, Entry, Settings, Transaction])],
      providers: [{
        provide: Ledger,
        inject: [getDataSourceToken(), AccountService, BalanceService, CurrencyService],
        useFactory: async (dataSource: DataSource, accountService: AccountService, balanceService: BalanceService, currencyService: CurrencyService) => {
          initialize && await initialize(dataSource, accountService, balanceService, currencyService)
          return new Ledger(dataSource, accountService, balanceService, currencyService)
        }
      }, AccountService, BalanceService, CurrencyService],
      controllers: [],
      exports: [Ledger],
    }
  }
}


type LedgerModuleAsyncOptions = {
  initialize?: (dataSource: DataSource, accountService: AccountService, balanceService: BalanceService, currencyService: CurrencyService) => Promise<void>
}
