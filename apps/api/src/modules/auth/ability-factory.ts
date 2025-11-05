import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType } from "@casl/ability"
import { Injectable } from "@nestjs/common"
import { Action, Role } from "@share"
import { Subjects } from "@share/action.enum"
import { StarsTopUp, TONTopUp, User } from "@share/entities"
import { NeverError } from "@share/errors"

import { plainToInstance } from "class-transformer"
import { packRules } from "@casl/ability/extra"

export type AppAbility = Ability<[Action, Subjects]>

@Injectable()
export class AbilityFactory {
  constructor() {}

  async create(user: Pick<User, "id" | "role"> | null) {
    const ability = new AbilityBuilder<Ability<[Action, Subjects]>>(Ability as AbilityClass<AppAbility>)

    if (!user) {
      this.forAnonym(ability)
      return ability.build({
        detectSubjectType: AbilityFactory.detectSubjectType,
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
      detectSubjectType: AbilityFactory.detectSubjectType,
    })
  }

  protected forAnonym(ability: AbilityBuilder<AppAbility>) {
    const { can, cannot } = ability
  }

  protected forAdmin(
    ability: AbilityBuilder<AppAbility>,
    user: Pick<User, "id" | "role">
  ) {
    const { can, cannot } = ability
    can([Action.Create, Action.Read, Action.Update, Action.Delete], "all")
  }

  protected forNormal(
    ability: AbilityBuilder<AppAbility>,
    user: Pick<User, "id" | "role">
  ) {
    const { can, cannot } = ability


    can(Action.Read, User, { id: user.id })
    can(Action.Update, User, ["languageCode"], { id: user.id }, )

    can(Action.Create, StarsTopUp)
    can(Action.Read, StarsTopUp, {userId: user.id})

    can(Action.Create, TONTopUp)
    can(Action.Read, TONTopUp, {userId: user.id})
  }

  public static detectSubjectType(item: any) {
    return item.constructor as ExtractSubjectType<Subjects>
  }

  public static getPackedRules(ability: AppAbility) {
    return packRules(ability.rules, AbilityFactory.packSubject)
  }

  protected static packSubject(subject: any) {
    if (typeof subject === "string") {
      return subject
    }
    if (typeof subject === "function") {
      return subject.name
    }
    return subject.constructor.name
  }
}
