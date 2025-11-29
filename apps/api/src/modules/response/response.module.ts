import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Response, Request } from "@share/entities"
import { ResponseController } from "./response.controller"
import { ResponseService } from "./response.service"

@Module({
  imports: [TypeOrmModule.forFeature([Response, Request])],
  controllers: [ResponseController],
  providers: [ResponseService],
  exports: [ResponseService],
})
export class ResponseModule {}