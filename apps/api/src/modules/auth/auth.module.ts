import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import AuthService from "./auth.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Deal, User } from "@share/entities"
import { UserController } from "../user/user.controller"
import { AuthMiddleware } from "./auth.middleware"
import { UserService } from "../user/user.service"
import { AbilityFactory } from "./ability-factory"
import { RequestLoggingMiddleware } from "@server/logging"
import { ClsMiddleware } from "nestjs-cls"
import { GeoModule } from "../geo/geo.module"

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Deal]), GeoModule],
  providers: [AuthService, AbilityFactory, UserService],
  controllers: [AuthController, UserController],
  exports: [AbilityFactory, UserService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(ClsMiddleware, RequestLoggingMiddleware, AuthMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL })
  }
}
