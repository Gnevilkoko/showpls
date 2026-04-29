import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Request, User } from '@share/entities'
import { GeoService } from './geo.service'
import { CacheModule } from '@nestjs/cache-manager'

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, User]),
    CacheModule.register(),
  ],
  controllers: [],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}