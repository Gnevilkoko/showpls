import { TestingModule } from "@nestjs/testing"
import { UserService } from "../modules/user"
import { faker } from "@faker-js/faker/locale/en"
import { LanguageCode, Role } from "@share"

export class FixtureService {
  constructor(protected module: TestingModule) {}

  async createUser({ role }: { role?: Role } = {}) {
    return await this.module.get(UserService).create({
      firstName: faker.person.firstName(),
      role: role || Role.Normal,
      languageCode: LanguageCode.EN,
      tgId: faker.number.int().toString(),
    })
  }
}
