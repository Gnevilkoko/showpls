import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { StarsTopUp } from "@share/entities"
import { StarsTopUpService } from "./stars-top-up.service"
import { StarsTopUpController } from "./stars-top-up.controller"

@Module({
  imports: [TypeOrmModule.forFeature([StarsTopUp])],
  providers: [StarsTopUpService],
  controllers: [StarsTopUpController],
  exports: [StarsTopUpService],
})
export class TopUpModule {}
