import appRoot from "app-root-path"
import dotenv from "dotenv"
import { existsSync } from "fs"
import path from "path"
import process from "process"

export class ConfigService {
  static readonly mediaRoot = path.join(ConfigService.getRootDir(), "media")
  static readonly mediaPrivateRoot = path.join(ConfigService.mediaRoot, "private")

  static readonly mediaURL = "/media/"

  protected static NODE_ENV = process.env.NODE_ENV

  static loadEnv() {
    const root = ConfigService.getRootDir()
    dotenv.config({ path: path.join(root, ".env.development"), quiet: true })
    const productionEnvPath = path.join(root, ".env.production")
    if (existsSync(productionEnvPath)) {
      dotenv.config({ path: productionEnvPath, override: true, quiet: true })
    }
  }

  static getRootDir() {
    return appRoot.path
  }

  static isDevelopment() {
    return ConfigService.NODE_ENV === "development"
  }

  static isProduction() {
    return ConfigService.NODE_ENV === "production"
  }

  static isTest() {
    return ConfigService.NODE_ENV === "test"
  }
}
