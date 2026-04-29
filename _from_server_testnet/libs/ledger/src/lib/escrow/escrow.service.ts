import { Injectable, Logger } from "@nestjs/common"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, EntityManager } from "typeorm"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { EscrowHoldParams, EscrowHoldService } from "@ledger/escrow/escrow-hold.service"
import { EscrowReleaseParams, EscrowReleaseService } from "@ledger/escrow/escrow-release.service"
import { EscrowRefundParams, EscrowRefundService } from "@ledger/escrow/escrow-refund.service"

@Injectable()
export class EscrowService {

  protected logger = new Logger(EscrowService.name)
  protected holdService: EscrowHoldService
  protected releaseService: EscrowReleaseService
  protected refundService: EscrowRefundService

  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    protected account: AccountService,
    protected balance: BalanceService,
    protected currency: CurrencyService
  ) {
    this.holdService = new EscrowHoldService(dataSource, account, balance, currency)
    this.releaseService = new EscrowReleaseService(dataSource, account, balance, currency)
    this.refundService = new EscrowRefundService(dataSource, account, balance, currency)
  }

  async hold(params: EscrowHoldParams, manager: EntityManager) {
    await this.holdService.hold.bind(this.holdService)(params, manager)
  }

  async release(params: EscrowReleaseParams, manager: EntityManager) {
    await this.releaseService.release.bind(this.releaseService)(params, manager)
  }

  async refund(params: EscrowRefundParams, manager: EntityManager) {
    await this.refundService.refund.bind(this.refundService)(params, manager)
  }
}
