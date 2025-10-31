import { DynamicModule, ModuleMetadata, Provider } from "@nestjs/common"
import { Ledger } from "./ledger"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { getDataSourceToken, TypeOrmModule } from "@nestjs/typeorm"
import { Account, Balance, Currency, Entry, Settings, Transaction } from "@ledger/entities"
import { DataSource } from "typeorm"
import { EscrowService } from "@ledger/escrow/escrow.service"
import { DepositService } from "@ledger/deposit/deposit.service"

export class LedgerModule {
  public static forRootAsync({ setup }: LedgerModuleAsyncOptions = {}): DynamicModule {
    return {
      module: LedgerModule,
      global: true,
      imports: [TypeOrmModule.forFeature([Account, Balance, Currency, Entry, Settings, Transaction])],
      providers: [
        {
          provide: Ledger,
          inject: [
            getDataSourceToken(),
            AccountService,
            BalanceService,
            CurrencyService,
            EscrowService,
            DepositService,
          ],
          useFactory: async (
            dataSource: DataSource,
            accountService: AccountService,
            balanceService: BalanceService,
            currencyService: CurrencyService,
            escrowService: EscrowService,
            depositService: DepositService
          ) => {
            const ledger = new Ledger(
              dataSource,
              accountService,
              balanceService,
              currencyService,
              escrowService,
              depositService
            )

            setup && (await setup(ledger))
            return ledger
          },
        },
        EscrowService,
        AccountService,
        BalanceService,
        CurrencyService,
        DepositService,
      ],
      controllers: [],
      exports: [Ledger],
    }
  }
}

type LedgerModuleAsyncOptions = {
  setup?: (ledger: Ledger) => Promise<void> | void
}
