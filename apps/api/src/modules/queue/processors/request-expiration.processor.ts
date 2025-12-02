import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Request } from '@share/entities'
import { RequestStatus } from '@share/request-status.enum'
import { Ledger } from '@ledger'

interface RequestExpirationJobData {
  requestId: string
}

@Processor('request-expiration')
@Injectable()
export class RequestExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(RequestExpirationProcessor.name)

  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    private readonly ledger: Ledger,
    private readonly dataSource: DataSource,
  ) {
    super()
  }

  async process(job: Job<RequestExpirationJobData>): Promise<void> {
    const { requestId } = job.data

    this.logger.log(`Processing expiration for request ${requestId}`)

    try {
      await this.dataSource.transaction(async (manager) => {
        // Fetch the request
        const request = await manager.findOne(Request, {
          where: { id: requestId },
          relations: ['customer'],
        })

        if (!request) {
          this.logger.warn(`Request ${requestId} not found`)
          return
        }

        // Check if status is still PUBLISHED (or OPEN if that's the initial status)
        if (request.status !== RequestStatus.Published) {
          this.logger.log(
            `Request ${requestId} status is ${request.status}, skipping expiration`,
          )
          return
        }

        this.logger.log(`Expiring request ${requestId}`)

        // Refund escrow
        await this.ledger.escrow.refund(
          {
            externalType: 'request',
            externalId: requestId,
          },
          manager,
        )

        // Update request status to EXPIRED (or CANCELLED)
        request.status = RequestStatus.Cancelled
        request.cancelledAt = new Date()
        await manager.save(Request, request)

        this.logger.log(`Request ${requestId} expired successfully`)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      this.logger.error(
        `Failed to expire request ${requestId}: ${errorMessage}`,
        errorStack,
      )
      throw error
    }
  }
}