import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository } from "typeorm"
import { Deal, FileAttachment, Request, Submission, SubmissionStatus, User } from "@share/entities"
import { CreateSubmissionDto } from "./dto/create-submission.dto"
import { RequestStatus } from "@share/request-status.enum"
import { DealStatus } from "@share/deal-status.enum"
import { NotificationService } from "../notification/notification.service"
import { ChatService } from "../chat/chat.service"
import { createHash } from "crypto"
import axios from "axios"

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name)

  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(FileAttachment)
    private readonly fileAttachmentRepository: Repository<FileAttachment>,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
    private readonly chatService: ChatService,
  ) {}

  private validateUUID(uuid: string, fieldName: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      throw new BadRequestException(`Invalid ${fieldName}: must be a valid UUID`)
    }
  }

  private async validateAttachments(attachments: string[]): Promise<{ url: string; hash: string }[]> {
    const results: { url: string; hash: string }[] = []

    for (const url of attachments) {
      try {
        // Download file
        const response = await axios.get(url, { responseType: "arraybuffer" })
        const buffer = Buffer.from(response.data)

        // Calculate SHA256 hash
        const hash = createHash("sha256").update(buffer).digest("hex")

        results.push({ url, hash })
      } catch (error) {
        throw new BadRequestException(`Failed to process attachment: ${url}`)
      }
    }

    return results
  }

  async create(user: User, dto: CreateSubmissionDto): Promise<Submission> {
    // Validate UUID format
    this.validateUUID(dto.requestId, "requestId")

    // 1. Validate Request and Deal
    const request = await this.requestRepository.findOne({
      where: { id: dto.requestId },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // Find active deal for this request where user is performer
    this.logger.log(`Looking for deal with requestId: ${dto.requestId}, performerId: ${user.id}`)
    
    // Find deal that is either Accepted or InProgress
    const deal = await this.dealRepository.findOne({
      where: [
        {
          request: { id: dto.requestId },
          performer: { id: user.id },
          status: DealStatus.Accepted,
        },
        {
          request: { id: dto.requestId },
          performer: { id: user.id },
          status: DealStatus.InProgress,
        }
      ],
      relations: ["chat"],
    })

    this.logger.log(`Deal found: ${deal ? 'YES' : 'NO'}`)
    if (!deal) {
      // Let's check if there are any deals for this request with this performer regardless of status
      const anyDeal = await this.dealRepository.findOne({
        where: {
          request: { id: dto.requestId },
          performer: { id: user.id },
        },
        relations: ["chat"],
      })
      
      if (anyDeal) {
        this.logger.log(`Found a deal but with different status: ${anyDeal.status}`)
        throw new BadRequestException(`Deal exists but has status: ${anyDeal.status}. Expected: ${DealStatus.Accepted} or ${DealStatus.InProgress}`)
      }
      
      // Check if there are any deals for this request at all
      const requestDeals = await this.dealRepository.find({
        where: {
          request: { id: dto.requestId },
        },
        relations: ["performer", "chat"],
      })
      
      this.logger.log(`Total deals for this request: ${requestDeals.length}`)
      requestDeals.forEach(d => {
        this.logger.log(`Deal ID: ${d.id}, Performer ID: ${d.performer.id}, Status: ${d.status}`)
      })
      
      throw new BadRequestException("You are not the performer of the active deal for this request")
    }

    // 2. Validate Attachments
    const attachmentHashes = await this.validateAttachments(dto.attachments)

    // 3. Check for duplicates (MVP: just log them)
    for (const attachment of attachmentHashes) {
      const existingAttachment = await this.fileAttachmentRepository.findOne({
        where: { hash: attachment.hash },
        relations: ["submission"],
      })

      if (existingAttachment) {
        this.logger.warn(`Duplicate file detected! Hash: ${attachment.hash}, Existing Submission: ${existingAttachment.submission?.id}`)
        // In future: save info about duplicates
      }
    }

    // 4. Create Submission in Transaction
    return this.dataSource.transaction(async (manager) => {
      // Create Submission
      const submission = this.submissionRepository.create({
        request,
        performer: user,
        proofMeta: dto.proofMeta,
        serverTs: new Date(),
        status: SubmissionStatus.SUBMITTED,
      })

      const savedSubmission = await manager.save(Submission, submission)

      // Create FileAttachments
      for (const attachment of attachmentHashes) {
        const fileAttachment = this.fileAttachmentRepository.create({
          url: attachment.url,
          hash: attachment.hash,
          submission: savedSubmission,
        })
        await manager.save(FileAttachment, fileAttachment)
      }

      // Update Request status to IN_PROGRESS if not already
      if (request.status !== RequestStatus.InProgress) {
        await manager.update(Request, { id: request.id }, { status: RequestStatus.InProgress })
      }

      // Update Deal status to IN_PROGRESS if not already
      if (deal.status !== DealStatus.InProgress) {
        await manager.update(Deal, { id: deal.id }, { status: DealStatus.InProgress })
      }

      // Update Chat isActiveOrder = true
      if (deal.chat) {
        await this.chatService.updateIsActiveOrder(deal.chat.id, true)
      }

      // Send Notification to Customer
      await this.notificationService.send(request.customer.id, "notification", {
        type: "notification",
        variant: "upload",
        requestId: request.id,
        submissionId: savedSubmission.id,
        performerName: `${user.firstName} ${user.lastName}`,
        text: `Исполнитель ${user.firstName} ${user.lastName} загрузил пруфы выполнения заказа`,
      })

      // Return the saved submission directly to avoid "Submission not found" error
      // due to transaction isolation or timing issues
      return savedSubmission
    })
  }

  async findOne(id: string): Promise<Submission> {
    this.validateUUID(id, "submission id")

    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ["request", "performer", "attachments"],
    })

    if (!submission) {
      throw new NotFoundException("Submission not found")
    }

    return submission
  }

  async findByRequest(requestId: string): Promise<Submission | null> {
    this.validateUUID(requestId, "requestId")

    return this.submissionRepository.findOne({
      where: { request: { id: requestId } },
      relations: ["request", "performer", "attachments"],
      order: { serverTs: "DESC" },
    })
  }
}