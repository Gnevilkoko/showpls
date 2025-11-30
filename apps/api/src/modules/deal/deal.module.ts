import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Deal, Request, Response } from "@share/entities"
import { DealController } from "./deal.controller"
import { DealService } from "./deal.service"

@Module({
  imports: [
    TypeOrmModule.forFeature([Deal, Request, Response])
  ],
  controllers: [DealController],
  providers: [DealService],
  exports: [DealService],
})
export class DealModule {}