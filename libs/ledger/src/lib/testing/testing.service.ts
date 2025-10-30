import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions"
import { Account, Balance, Currency, Entry, Settings, Transaction } from "@ledger/entities"
import { Test } from "@nestjs/testing"
import { TypeOrmModule } from "@nestjs/typeorm"
import { DataSource, DataSourceOptions } from "typeorm"
import { LedgerModule } from "@ledger"
import { DatabaseConfig } from "../../../../../apps/api/src/config"

export class TestingService {
  public static async dropDataSources() {
    const dataSource = new DataSource(DatabaseConfig)
    await dataSource.initialize()
    await dataSource.destroy()
  }

  public static async getModule() {
    return await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          name: "default",
          inject: [],
          useFactory: async () => {
            return {
              autoLoadEntities: true,
              ...databaseConfig,
            }
          },
          dataSourceFactory: async (options) => {
            const dataSource = new DataSource({ ...options } as DataSourceOptions)
            await dataSource.initialize()
            return dataSource
          },
        }),
        LedgerModule.forRootAsync(),
      ],
      providers: [],
      controllers: [],
      exports: [],
    }).compile()
  }
}

const databaseConfig: PostgresConnectionOptions = {
  logging: ["log", "warn", "error"],
  type: "postgres",
  host: process.env.POSTGRES_HOST,
  port: +(process.env.POSTGRES_PORT as string),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  entities: [Account, Balance, Currency, Entry, Settings, Transaction],
}
