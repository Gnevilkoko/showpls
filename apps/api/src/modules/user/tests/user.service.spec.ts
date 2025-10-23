import { TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import { DataSource } from "typeorm"
import {TestingService} from "../../../testing"
import { AppModule } from "../../../app.module"

describe("UserService", () => {
  let module: TestingModule
  let dataSource: DataSource

    beforeEach(async () => {
       await TestingService.dropDataSources()


    })

  it("should create() works", async () => {

  })
})
