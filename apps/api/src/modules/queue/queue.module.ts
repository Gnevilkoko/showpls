import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { RedisConfig } from '../../config'
import { RequestExpirationProcessor } from './processors/request-expiration.processor'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Request } from '@share/entities'
import { LedgerModule } from '@ledger/ledger.module'
import { BaseProcessor } from './base/base-processor'

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
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    TypeOrmModule.forFeature([Request]),
    LedgerModule,
  ],
  providers: [RequestExpirationProcessor],
  exports: [BullModule],
})
export class QueueModule {}