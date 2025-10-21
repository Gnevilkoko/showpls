import { Module } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { TypeOrmModule } from "@nestjs/typeorm"
import { User } from "@share/entities"


@Module({
  imports: [
    TypeOrmModule.forFeature([
      User
    ])
  ],
  providers: [
    AuthService
  ],
  controllers: [
    AuthController
  ],
  exports: [

  ]
})
export class AuthModule {

}
