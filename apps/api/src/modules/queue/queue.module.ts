import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { RedisConfig } from '../../config'
import { RequestExpirationProcessor } from './processors/request-expiration.processor'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Request } from '@share/entities'
import { LedgerModule } from '@ledger/ledger.module'

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: RedisConfig.host,
        port: RedisConfig.port,
        db: RedisConfig.db,
      },
    }),
    BullModule.registerQueue({
      name: 'request-expiration',
    }),
    TypeOrmModule.forFeature([Request]),
    LedgerModule,
  ],
  providers: [RequestExpirationProcessor],
  exports: [BullModule],
})
export class QueueModule {}