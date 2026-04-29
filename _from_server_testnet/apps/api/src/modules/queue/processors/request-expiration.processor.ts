import { Processor } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'
import { Request } from '@share/entities'
import { RequestStatus } from '@share/request-status.enum'
import { Ledger } from '@ledger'
import { BaseProcessor } from '../base/base-processor'

interface RequestExpirationJobData {
  requestId: string
}

@Processor('request-expiration')
@Injectable()
export class RequestExpirationProcessor extends BaseProcessor {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    private readonly ledger: Ledger,
    private readonly dataSource: DataSource,
  ) {
    super(RequestExpirationProcessor.name)
  }

  async processJob(job: Job<RequestExpirationJobData>): Promise<void> {
    const { requestId } = job.data

    this.logger.log(`Processing expiration for request ${requestId}`)

    await this.dataSource.transaction(async (manager) => {
      // Fetch the request
      const request = await manager.findOne(Request, {
        where: { id: requestId },
        relations: ['customer'],
      })

      if (!request) {
        this.logger.warn(`Request ${requestId} not found, marking job as completed`)
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

      // Refund escrow with error handling
      try {
        await this.ledger.escrow.refund(
          {
            externalType: 'request',
            externalId: requestId,
          },
          manager,
        )
      } catch (escrowError) {
        this.logger.error(
          `Failed to refund escrow for request ${requestId}: ${escrowError instanceof Error ? escrowError.message : 'Unknown escrow error'}`,
          escrowError instanceof Error ? escrowError.stack : undefined,
        )
        // Don't throw here, continue with status update
      }

      // Update request status to EXPIRED (or CANCELLED)
      request.status = RequestStatus.Cancelled
      request.cancelledAt = new Date()
      await manager.save(Request, request)

      this.logger.log(`Request ${requestId} expired successfully`)
    })
  }

  /**
   * Отправка уведомления администратору о критических ошибках
   */
  protected async sendAdminAlert(message: string): Promise<void> {
    this.logger.error(`ADMIN ALERT: ${message}`)
    // В реальном проекте здесь может быть интеграция с системой уведомлений
    // await this.notificationService.sendAdminAlert(message)
  }
}