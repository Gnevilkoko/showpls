import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm"
import { EntityManager, Repository, DataSource } from "typeorm"
import { User } from "@share/entities"
import { Blockchain, LanguageCode, Role, Token } from "@share"
import { DbHelpers } from "../../db"
import UserExceptions from "./user.exceptions"
import { NotImplemented } from "@share/errors"
import { UserListDto } from "./dto/user-list.dto"
import { UpdateProfileDto } from "./dto/update-profile.dto"
import { paginate } from "nestjs-typeorm-paginate"
import { Ledger } from "@ledger"
import { AccountOwnerType, Entry } from "@ledger/entities"

@Injectable()
export class UserService {
  protected logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(User) protected repository: Repository<User>,
    @InjectDataSource() protected dataSource: DataSource,
    protected ledger: Ledger,
  ) {}

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

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.repository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const updateData: Partial<User> = {}
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName
    if (dto.avatar !== undefined) updateData.avatar = dto.avatar
    if (dto.about !== undefined) updateData.about = dto.about
    if (dto.city !== undefined) updateData.city = dto.city

    if (Object.keys(updateData).length > 0) {
      await this.repository.update(userId, updateData)
    }

    return this.retrieve(userId)
  }

  async toggleAvailable(userId: string): Promise<{ isAvailable: boolean }> {
    const user = await this.repository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException("User not found")
    }

    const newValue = !user.isAvailable
    await this.repository.update(userId, { isAvailable: newValue })
    return { isAvailable: newValue }
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

  async getTransactions(userId: string, query: { limit?: number; offset?: number }) {
    const account = await this.ledger.account.retrieve(
      {
        ownerId: userId,
        ownerType: AccountOwnerType.User,
      },
      undefined
    )

    if (!account) {
      return { items: [], total: 0 }
    }

    const limit = query.limit || 20
    const offset = query.offset || 0

    const [entries, total] = await this.dataSource.getRepository(Entry)
      .createQueryBuilder("entry")
      .leftJoinAndSelect("entry.transaction", "transaction")
      .leftJoinAndSelect("entry.currency", "currency")
      .where("entry.accountId = :accountId", { accountId: account.id })
      .orderBy("entry.createdAt", "DESC")
      .take(limit)
      .skip(offset)
      .getManyAndCount()

    const items = entries.map(entry => ({
      id: entry.id,
      type: entry.transaction.type,
      status: entry.transaction.status,
      amount: entry.amount,
      currency: {
        code: entry.currency.code,
        blockchain: entry.currency.blockchain,
      },
      externalType: entry.transaction.externalType,
      externalId: entry.transaction.externalId,
      createdAt: entry.createdAt.toISOString(),
    }))

    return { items, total }
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
