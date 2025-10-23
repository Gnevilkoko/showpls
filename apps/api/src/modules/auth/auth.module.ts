import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { User } from "@share/entities"
import { UserController } from "../user/user.controller"
import { AuthMiddleware } from "./auth.middleware"
import { UserService } from "../user/user.service"


@Module({
  imports: [
    TypeOrmModule.forFeature([
      User
    ])
  ],
  providers: [
    AuthService,
    UserService
  ],
  controllers: [
    AuthController,
    UserController
  ],
  exports: [

  ]
})
export class AuthModule implements NestModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer
			.apply(AuthMiddleware)
			.forRoutes({path: "*", method: RequestMethod.ALL})
		// Это установка middleware глобально, а не только в рамках конкретно этого модуля.
	}
}
