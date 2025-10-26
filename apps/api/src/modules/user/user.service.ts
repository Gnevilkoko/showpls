import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { InjectLogger } from "@server/logging"
import { EntityManager, Repository } from "typeorm"
import { User } from "@share/entities"
import { Logger } from "winston"
import { LanguageCode, Role, Token } from "@share"
import { DbHelpers } from "../../db"
import UserExceptions from "./user.exceptions"
import { NotImplemented } from "@share/errors"
import { UserListDto } from "./dto/user-list.dto"
import { paginate } from "nestjs-typeorm-paginate"

@Injectable()
export class UserService {
  protected logger: Logger

  constructor(@InjectLogger() logger: Logger, @InjectRepository(User) protected repository: Repository<User>) {
    this.logger = logger.child({
      context: UserService.name,
    })
  }

  async create({ balances, ...params }: CreateUserParams, manager?: EntityManager | undefined) {
    try {
      const insertResult = await (manager || this.repository.manager)
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          ...params,
          lastName: params.lastName || null,
          balances: !balances
            ? {
                [Token.STARS]: "0",
                [Token.TON]: "0",
                [Token.USDT]: "0",
              }
            : balances,
          banned: false,
          lastSeenAt: new Date(),
        })
        .returning("*")
        .execute()

      return this.repository.create(insertResult.raw[0] as object)
    } catch (e) {
      if (e instanceof DbHelpers.isSerializationFailure) {
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
    await this.repository.update({id}, {languageCode})
  }

  public async incrementBalance(
    {
      userId,
      token,
      amount,
    }: {
      userId: string
      token: Token
      amount: string
    },
    manager: EntityManager | undefined
  ) {
    await (manager || this.repository.manager).query(
      `
        UPDATE "user" u
        SET "balances" = jsonb_set(
                "balances",
                '{${token}}',
                to_jsonb((COALESCE(("balances" ->> '${token}'), '0')::decimal + $2::decimal)::text),
                true)
        WHERE u.id = $1
    `,
      [userId, amount]
    )
  }

  public async decrementBalance(
    {
      userId,
      token,
      amount,
    }: {
      userId: string
      token: Token
      amount: string
    },
    manager: EntityManager | undefined
  ) {
    return await this.incrementBalance(
      {
        userId,
        token,
        amount: (-+amount).toString(),
      },
      manager
    )
  }
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
