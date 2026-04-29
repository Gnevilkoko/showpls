import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Currency } from "../entities"
import { IsNull, Repository } from "typeorm"
import { z } from "zod"
import LedgerExceptions from "@ledger/ledger.exceptions"
import { get } from "lodash"

@Injectable()
export class CurrencyService {
  constructor(@InjectRepository(Currency) protected repository: Repository<Currency>) {}

  async create(params: CreateCurrencyParams) {
    const result = createSchema.safeParse(params)
    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData(undefined, {
        cause: result.error
      })
    }

    const insertResult = await this.repository
      .createQueryBuilder()
      .insert()
      .into(Currency)
      .values(params)
      .returning("*")
      .execute()

    return this.repository.create(insertResult.raw[0] as object)
  }

  async retrieve(params: RetrieveCurrencyParams) {
    const result = retrieveSchema.safeParse(params)
    if (!result.success) {
      throw new LedgerExceptions.InvalidProvidedData(undefined, {
        cause: result.error
      })
    }
    const key = result.data

    const blockchain = get(key, "blockchain") as string | undefined | null
    return await this.repository.findOne({
      where: {
        id: get(key, "id"),
        code: get(key, "code"),
        blockchain: blockchain === null ? IsNull() : blockchain,
      },
    })
  }

  async list() {
    return this.repository.find({
      order: {
        createdAt: "desc"
      }
    })
  }
}

const retrieveSchema = z
  .object({
    id: z.coerce.bigint().positive().transform(String),
  })
  .or(
    z.object({
      code: z.string().min(2),
      blockchain: z.string().min(1).or(z.null()),
    })
  )

export type RetrieveCurrencyParams = z.infer<typeof retrieveSchema>

const createSchema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(3).max(50),
  scale: z.number().int().positive().min(2).max(18),
  blockchain: z.string().min(1).max(255).or(z.null()),
})

export type CreateCurrencyParams = z.infer<typeof createSchema>
