import { Address, Transaction } from "@ton/ton"
import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { TONIgnoredTransaction } from "@share/entities"
import { TONUtilities } from "../ton.utilities"
import { Token } from "@share"
import { TONTopUpService } from "../ton-top-up.service"
import { TONDaemon } from "../ton.daemon"

@Injectable()
export class ToncoinDaemon extends TONDaemon {
  protected logger = new Logger(ToncoinDaemon.name)
  protected address = Address.parse(process.env.TON_ADDRESS_FOR_ACCEPT_PAYMENTS as string)
  protected token = Token.TON as const

  constructor(
    @InjectRepository(TONIgnoredTransaction) protected repository: Repository<TONIgnoredTransaction>,
    protected service: TONTopUpService
  ) {
    super(repository, service)
  }

  async handlePage(transactions: Transaction[]) {
    for (let tx of transactions) {
      const txid = tx.hash().toString("hex")
      if (await this.isIgnored(txid)) {
        continue
      }

      const inMsg = tx.inMessage
      const outMsgs = tx.outMessages

      if (inMsg && inMsg.info.type === "internal" && outMsgs.size === 0) {
        const from = TONUtilities.standardizeAddress(inMsg.info.src)
        const to = TONUtilities.standardizeAddress(inMsg.info.dest)
        const body = inMsg.body.beginParse()
        const op = body.remainingBits < 32 ? null : body.loadUint(32)

        if (to !== TONUtilities.standardizeAddress(this.address)) {
          this.logger.warn({
            message: "Transaction with incorrect [dest] detected",
            txid,
          })
          await this.ignore(txid, "incorrect address in dest")
          continue
        }

        if (op !== 0 && op !== null) {
          this.logger.warn({
            message: "Transaction with unexpected opcode detected",
            txid,
          })
          await this.ignore(txid, "Unexpected opcode")
          continue
        }

        if (op === null) {
          this.logger.warn({
            message: "Transaction without payload detected",
            txid,
          })
          await this.ignore(txid, "memo isn't exists")
          continue
        }

        try {
          const _comment = body.loadStringTail()
          const comment = this.validateComment(_comment)
          await this.service.processPayment({
            txid,
            amount: inMsg.info.value.coins,
            token: this.token,
            memo: comment,
          })
        } catch (e: any) {
          this.logger.warn({
            message: "Transaction has invalid memo in payload",
            txid,
            // error: serializeError(e),
          })
          await this.ignore(txid, "invalid memo")
        }
      } else {
        await this.ignore(txid, "not interested transaction")
      }
    }
  }
}
