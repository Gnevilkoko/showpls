import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { EntityManager, Repository } from "typeorm"
import { User } from "@share/entities"
import { Blockchain, LanguageCode, Role, Token } from "@share"
import { DbHelpers } from "../../db"
import UserExceptions from "./user.exceptions"
import { NotImplemented } from "@share/errors"
import { UserListDto } from "./dto/user-list.dto"
import { paginate } from "nestjs-typeorm-paginate"
import { Ledger } from "@ledger"
import { AccountOwnerType } from "@ledger/entities"

@Injectable()
export class UserService {
  protected logger = new Logger(UserService.name)

  constructor(@InjectRepository(User) protected repository: Repository<User>, protected ledger: Ledger) {}

  async create({ balances, ...params }: CreateUserParams, manager?: EntityManager | undefined) {
    try {
      const insertResult = await (manager || this.repository.manager)
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          ...params,
          lastName: params.lastName || null,
          banned: false,
          lastSeenAt: new Date(),
        })
        .returning("*")
        .execute()

      return this.repository.create(insertResult.raw[0] as object)
    } catch (e) {
      if (DbHelpers.isUniqueError(e)) {
        throw new UserExceptions.AlreadyCreated()
      }

      throw e
    }
  }

  async retrieve(id: string) {
    return await this.repository.findOneOrFail({
      where: {
        id,
      },
    })
  }

  async update() {
    throw new NotImplemented()
  }

  async delete() {
    throw new NotImplemented()
  }

  async list({ page, limit, filter, sort }: UserListDto) {
    return paginate(
      this.repository,
      { page, limit },
      {
        where: {
          id: filter.id,
          tgId: filter.tgId,
          role: filter.role,
        },
        order: {
          createdAt: sort.createdAt,
        },
      }
    )
  }

  public async setLanguageCode(id: string, languageCode: LanguageCode) {
    await this.repository.update({ id }, { languageCode })
  }

  async getBalances(userId: string): Promise<Balance[]> {
    const currencies = await this.ledger.currency.list()
    const account = await this.ledger.account.retrieve(
      {
        ownerId: userId,
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    const balances: Balance[] = []

    for (let currency of currencies) {
      let balance = "0"
      let lockedBalance = "0"
      if (account) {
        const b = await this.ledger.balance.retrieve({ accountId: account.id, currencyId: currency.id }, undefined)
        if (b) {
          balance = b.amount
          lockedBalance = b.lockedAmount
        }
      }

      balances.push({
        token: currency.code as Token,
        blockchain: currency.blockchain as Blockchain | null,
        balance: balance,
        lockedBalance: lockedBalance,
      })
    }

    return balances
  }
}

type Balance = {
  token: Token
  blockchain: Blockchain | null
  balance: string
  lockedBalance: string
}

export type CreateUserParams = {
  role: Role
  tgId: string
  username?: string | null
  firstName: string
  lastName?: string | null
  avatar?: string | null
  languageCode: LanguageCode
  balances?: Record<Token, string>
}
