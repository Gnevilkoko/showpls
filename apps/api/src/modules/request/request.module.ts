import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Request, Response } from "@share/entities"
import { RequestController } from "./request.controller"
import { RequestService } from "./request.service"

@Module({
  imports: [TypeOrmModule.forFeature([Request, Response])],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}