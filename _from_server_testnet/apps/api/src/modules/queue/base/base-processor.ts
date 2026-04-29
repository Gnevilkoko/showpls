import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Injectable, Logger } from '@nestjs/common'

/**
 * Базовый класс для процессоров BullMQ с улучшенной обработкой ошибок
 */
@Injectable()
export abstract class BaseProcessor extends WorkerHost {
  protected readonly logger: Logger

  constructor(processorName: string) {
    super()
    this.logger = new Logger(processorName)
  }

  /**
   * Абстрактный метод, который должен быть реализован в дочерних классах
   */
  abstract processJob(job: Job<any>): Promise<any>

  /**
   * Основной метод обработки задачи с улучшенной обработкой ошибок
   */
  async process(job: Job<any>): Promise<any> {
    const attempt = job.attemptsMade || 0
    const maxAttempts = job.opts?.attempts || 3
    const jobName = job.name || 'unknown'
    const jobId = job.id || 'unknown'

    this.logger.log(`Processing job ${jobName}:${jobId} (attempt ${attempt + 1}/${maxAttempts})`)

    try {
      const result = await this.processJob(job)
      this.logger.log(`Successfully processed job ${jobName}:${jobId}`)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      
      this.logger.error(
        `Failed to process job ${jobName}:${jobId} (attempt ${attempt + 1}/${maxAttempts}): ${errorMessage}`,
        errorStack,
      )

      // Добавляем детальную информацию об ошибке в метаданные задачи
      try {
        await job.updateProgress({
          error: errorMessage,
          timestamp: new Date().toISOString(),
          attempt: attempt + 1,
        })
      } catch (progressError) {
        this.logger.warn(`Failed to update job progress: ${progressError instanceof Error ? progressError.message : 'Unknown error'}`)
      }

      // Если это последняя попытка, логируем критическую ошибку
      if (attempt >= maxAttempts - 1) {
        this.logger.error(
          `CRITICAL: Failed to process job ${jobName}:${jobId} after ${maxAttempts} attempts. Manual intervention required.`,
          errorStack,
        )
        
        // Здесь можно добавить отправку уведомления администратору
        // await this.sendAdminAlert(`Job processing failed: ${jobName}:${jobId}`)
      }

      throw error
    }
  }

  /**
   * Метод для отправки уведомления администратору о критических ошибках
   * (должен быть реализован в дочерних классах при необходимости)
   */
  protected async sendAdminAlert(message: string): Promise<void> {
    this.logger.warn(`Admin alert: ${message}`)
    // В реальном проекте здесь может быть интеграция с системой уведомлений
  }
}