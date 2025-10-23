import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { InjectLogger } from "@server/logging"
import { EntityManager, Repository } from "typeorm"
import { User } from "@share/entities"
import { Logger } from "winston"
import { LanguageCode, Role } from "@share"
import { DbHelpers } from "../../db"
import UserExceptions from "./user.exceptions"

@Injectable()
export class UserService {
  protected logger: Logger

  constructor(@InjectLogger() logger: Logger, @InjectRepository(User) protected repository: Repository<User>) {
    this.logger = logger.child({
      context: UserService.name,
    })
  }

  async create(params: CreateUserParams, manager?: EntityManager | undefined) {
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
      if (e instanceof DbHelpers.isSerializationFailure) {
        throw new UserExceptions.AlreadyCreated()
      }

      throw e
    }
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
}
