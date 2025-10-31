import { Injectable, Logger } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource } from "typeorm"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { AccountService } from "@ledger/account/account.service"
import { EscrowService } from "@ledger/escrow/escrow.service"
import { DepositService } from "@ledger/deposit/deposit.service"

@Injectable()
export class Ledger {
  protected logger = new Logger(Ledger.name)

  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    public account: AccountService,
    public balance: BalanceService,
    public currency: CurrencyService,
    public escrow: EscrowService,
    public deposit: DepositService
  ) {}
}
