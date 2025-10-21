import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType, MongoQuery } from "@casl/ability"
import { Injectable } from "@nestjs/common"
import { Action, Role } from "@share"
import { Subjects } from "@share/action.enum"
import {
  User,
} from "@share/entities"
import { NeverError } from "@share/errors"

import { plainToInstance } from "class-transformer"

export type AppAbility = Ability<[Action, Subjects]>

@Injectable()
export class AbilityFactory {
  constructor() {}

  async create(user: Pick<User, "id" | "role"> | null) {
    const ability = new AbilityBuilder<Ability<[Action, Subjects]>>(Ability as AbilityClass<AppAbility>)

    if (!user) {
      this.forAnonym(ability)
      return ability.build({
        detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
      })
    }

    user = plainToInstance(User, user)

    switch (user.role) {
      case Role.Admin:
        this.forAdmin(ability, user)
        break
      case Role.Normal:
        this.forNormal(ability, user)
        break
      default:
        throw new NeverError(user.role)
    }

    return ability.build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    })
  }

  protected forAnonym(ability: AbilityBuilder<Ability<[Action, Subjects], MongoQuery>>) {
    const { can, cannot } = ability
  }

  protected forAdmin(
    ability: AbilityBuilder<Ability<[Action, Subjects], MongoQuery>>,
    user: Pick<User, "id" | "role">,
  ) {
    const { can, cannot } = ability
    can([Action.Create, Action.Read, Action.Update, Action.Delete], "all")
  }

  protected forNormal(
    ability: AbilityBuilder<Ability<[Action, Subjects], MongoQuery>>,
    user: Pick<User, "id" | "role">,
  ) {
    const { can, cannot } = ability

    can(Action.Read, User, { id: user.id })
    can(Action.Update, User, { id: user.id })
  }
}
