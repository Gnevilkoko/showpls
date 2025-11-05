import { Logger, OnModuleDestroy, OnModuleInit, Provider } from "@nestjs/common"
import { Address, TonClient, Transaction } from "@ton/ton"
import { Subscription } from "rxjs"
import { JettonService } from "./jetton.service"
import { TONDaemon } from "../ton.daemon"
import { Token } from "@share"
import { getRepositoryToken, InjectRepository } from "@nestjs/typeorm"
import { TONIgnoredTransaction } from "@share/entities"
import { Repository } from "typeorm"
import { TONTopUpService } from "../ton-top-up.service"
import { getJettonServiceToken } from "./get-jetton-service-token"
import { getJettonDaemonToken } from "./get-jetton-daemon-token"
import { TONUtilities } from "../ton.utilities"

export class JettonDaemon extends TONDaemon {
  protected logger: Logger
  protected token = Token.USDT

  constructor(
    protected address: Address,
    @InjectRepository(TONIgnoredTransaction) protected repository: Repository<TONIgnoredTransaction>,
    protected service: TONTopUpService,
    protected jettonService: JettonService
  ) {
    super(repository, service)
    this.logger = new Logger(`${JettonDaemon.name}-${this.token}`)
  }


  async handlePage(transactions: Transaction[]) {
    for (let tx of transactions) {
      const txid = tx.hash().toString("hex")
      if (await this.isIgnored(txid)) {
        continue
      }
      const inMsg = tx.inMessage
      const outMsgs = tx.outMessages

      if (inMsg && inMsg.info.type === "internal") {
        const body = inMsg.body.beginParse()
        const op = body.remainingBits < 32 ? null : body.loadUint(32)

        if (op !== 0x178d4519) {
          this.logger.warn({
            message: "Transaction with unexpected opcode detected",
            txid,
          })
          await this.ignore(txid, "Unexpected opcode")
          continue
        }

        if (TONUtilities.standardizeAddress(this.address) !== TONUtilities.standardizeAddress(inMsg.info.dest)) {
          this.logger.warn({
            message: "Transaction with incorrect [dest] detected",
            txid,
          })
          await this.ignore(txid, "Incorrect address in dest")
          continue
        }

        const result = await this.provider.runMethod(inMsg.info.src, "get_wallet_data")
        const stack = result.stack

        const balance = BigInt(stack.readBigNumber())
        const owner = stack.readAddress()
        const jettonMaster = stack.readAddress()


        if (
          TONUtilities.standardizeAddress(jettonMaster) !==
          TONUtilities.standardizeAddress(this.jettonService.getJettonMaster())
        ) {
          this.logger.warn({
            message: "Wrong jetton master,",
            txid,
          })
          await this.ignore(txid, "scam transaction, wrong jetton master")
          continue
        }

        try {
          let _comment: null | string = null
          const queryId = body.loadUintBig(64)
          const amount = body.loadCoins()
          const from = body.loadAddress()
          const responseDestination = body.loadAddress() // response_destination
          const forwardTonAmount = body.loadCoins() // uint64

          if (body.remainingRefs > 0) {
            const payloadCell = body.loadRef()
            const payloadSlice = payloadCell.beginParse()

            const maybeOp = payloadSlice.loadUint(32)
            if (maybeOp === 0) {
              _comment = payloadSlice.loadStringTail() // UTF-8 строка
            }
          }

          if (!_comment) {
            this.logger.warn({
              message: "Transaction without payload detected",
              txid,
            })
            await this.ignore(txid, "memo isn't exists")
            continue
          }

          try {
            const comment = this.validateComment(_comment)
            await this.service.processPayment({
              txid,
              amount,
              token: this.token,
              memo: comment,
            })
          } catch (e) {
            this.logger.warn({
              message: "Transaction has invalid memo in payload",
              txid,
              // error: serializeError(e),
            })
            await this.ignore(txid, "invalid memo")
          }
        } catch (e) {
          this.logger.error(e)
          await this.ignore(txid, "Invalid transaction, parsing error")
          continue
        }
      } else {
        await this.ignore(txid, "not interested transaction")
      }
    }
  }

  public static async initialize(
    repository: Repository<TONIgnoredTransaction>,
    service: TONTopUpService,
    jettonService: JettonService
  ) {
    const jettonWallet = await jettonService.getJettonWallet(process.env.TON_ADDRESS_FOR_ACCEPT_PAYMENTS as string)
    return new JettonDaemon(jettonWallet, repository, service, jettonService)
  }
}

export const getJettonDaemonProvider = (token: Token): Provider => {
  return {
    provide: getJettonDaemonToken(token),
    inject: [getRepositoryToken(TONIgnoredTransaction), TONTopUpService, getJettonServiceToken(token)],
    useFactory: async (
      repository: Repository<TONIgnoredTransaction>,
      service: TONTopUpService,
      jettonService: JettonService
    ) => {
      return await JettonDaemon.initialize(repository, service, jettonService)
    },
  }
}
