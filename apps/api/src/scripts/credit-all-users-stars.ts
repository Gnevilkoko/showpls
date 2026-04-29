import "reflect-metadata"
import { IsNull } from "typeorm"
import { AccountService } from "@ledger/account/account.service"
import { BalanceService } from "@ledger/balance/balance.service"
import { CurrencyService } from "@ledger/currency/currency.service"
import { DepositService } from "@ledger/deposit/deposit.service"
import { Currency } from "@ledger/entities"
import { Token, TokenService } from "@share"
import { User } from "@share/entities"
import { ConfigService } from "../config/config.service"
import dataSource from "../db/data-source"

const STARS_PER_USER = 100
/** Идемпотентность: повторный запуск с тем же суффиксом не дублирует начисление. */
const GRANT_BATCH_SUFFIX = process.env.STARS_GRANT_BATCH_SUFFIX ?? "2026-04-08-dev"

async function main() {
  ConfigService.loadEnv()
  await dataSource.initialize()

  const starsCurrency = await dataSource.getRepository(Currency).findOne({
    where: { code: Token.STARS, blockchain: IsNull() },
  })
  if (!starsCurrency) {
    throw new Error(`Currency STARS (blockchain null) not found`)
  }

  const decimals = TokenService.getDecimals(Token.STARS)
  const amountAtomic = BigInt(STARS_PER_USER) * 10n ** BigInt(decimals)

  const users = await dataSource.getRepository(User).find({ select: { id: true } })
  const accountSvc = new AccountService(dataSource)
  const balanceSvc = new BalanceService(dataSource)
  const currencySvc = new CurrencyService(dataSource.getRepository(Currency))
  const deposit = new DepositService(dataSource, accountSvc, balanceSvc, currencySvc)

  let credited = 0

  for (const u of users) {
    await dataSource.transaction("SERIALIZABLE", async (manager) => {
      const externalId = `bulk-${GRANT_BATCH_SUFFIX}-user-${u.id}`
      await deposit.create(
        {
          userId: u.id,
          amount: amountAtomic,
          currencyId: starsCurrency.id,
          externalId,
          externalType: "dev_bulk_grant",
        },
        manager
      )
    })
    credited++
  }

  console.log(
    JSON.stringify({
      starsPerUser: STARS_PER_USER,
      amountAtomic: amountAtomic.toString(),
      usersTotal: users.length,
      transactionsAttempted: credited,
      batchSuffix: GRANT_BATCH_SUFFIX,
      note: "If a row already existed for externalType+externalId, deposit.create skips silently.",
    })
  )

  await dataSource.destroy()
}

main().catch(async (e) => {
  console.error(e)
  if (dataSource.isInitialized) {
    await dataSource.destroy()
  }
  process.exit(1)
})
