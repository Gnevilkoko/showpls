import { DataSource } from "typeorm"
import { ConfigService } from "../config"
import databaseConfig from "../config/database.config"
import { allMigrationsOrdered } from "./migrations.register"

ConfigService.loadEnv()

const base = databaseConfig()

/** CLI: `nx run api:migration:run` — полная цепочка, без dropSchema/synchronize. */
export default new DataSource({
  ...base,
  synchronize: false,
  dropSchema: false,
  migrationsRun: false,
  migrations: allMigrationsOrdered,
})
