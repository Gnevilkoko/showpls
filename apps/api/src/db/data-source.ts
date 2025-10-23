import { DataSource } from "typeorm"
import { ConfigService } from "../config"
import databaseConfig from "../config/database.config"

ConfigService.loadEnv()
export default new DataSource(databaseConfig()) // FOR CLI
