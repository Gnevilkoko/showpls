import { DataSource } from "typeorm"
import { ConfigService } from "./config/config.service"
import databaseConfig from "./config/database.config"
import { allMigrationsOrdered } from "./db/migrations.register"

ConfigService.loadEnv()

const base = databaseConfig()

/** npm run migration:* — та же полная цепочка, что и `db/data-source.ts`. */
export default new DataSource({
  ...base,
  synchronize: false,
  dropSchema: false,
  migrationsRun: false,
  migrations: allMigrationsOrdered,
})