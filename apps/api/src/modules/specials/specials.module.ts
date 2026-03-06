import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Special, SpecialClaim } from "@share/entities"
import { SpecialsController } from "./specials.controller"
import { SpecialsService } from "./specials.service"

@Module({
  imports: [TypeOrmModule.forFeature([Special, SpecialClaim])],
  controllers: [SpecialsController],
  providers: [SpecialsService],
  exports: [SpecialsService],
})
export class SpecialsModule {}
