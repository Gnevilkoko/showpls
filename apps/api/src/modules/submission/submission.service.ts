import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository } from "typeorm"
import { Deal, FileAttachment, Request, Response, Submission, SubmissionStatus, User } from "@share/entities"
import { CreateSubmissionDto } from "./dto/create-submission.dto"
import { RejectSubmissionDto } from "./dto/reject-submission.dto"
import { RequestStatus } from "@share/request-status.enum"
import { DealStatus } from "@share/deal-status.enum"
import { NotificationService } from "../notification/notification.service"
import { ChatService } from "../chat/chat.service"
import { createHash } from "crypto"
import axios from "axios"
import { URL } from "url"

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
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
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

  /**
   * Validates URL to prevent SSRF attacks
   * @param urlString URL to validate
   * @throws BadRequestException if URL is unsafe
   */
  private validateUrlSafety(urlString: string): void {
    try {
      const url = new URL(urlString)

      // Only allow HTTP and HTTPS protocols
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new BadRequestException("Only HTTP and HTTPS protocols are allowed")
      }

      // Block localhost and loopback addresses
      const hostname = url.hostname.toLowerCase()
      const blockedHostnames = [
        "localhost",
        "127.0.0.1",
        "0.0.0.0",
        "::1",
        "0:0:0:0:0:0:0:1",
      ]

      if (blockedHostnames.includes(hostname)) {
        throw new BadRequestException("Access to localhost is not allowed")
      }

      // Block private IP ranges
      const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
      const ipv4Match = hostname.match(ipv4Regex)

      if (ipv4Match) {
        const [, octet1, octet2, octet3, octet4] = ipv4Match.map(Number)

        // Validate octets are in range
        if ([octet1, octet2, octet3, octet4].some(o => o > 255)) {
          throw new BadRequestException("Invalid IP address")
        }

        // Block private IPv4 ranges
        // 10.0.0.0/8
        if (octet1 === 10) {
          throw new BadRequestException("Access to private network is not allowed")
        }
        // 172.16.0.0/12
        if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
          throw new BadRequestException("Access to private network is not allowed")
        }
        // 192.168.0.0/16
        if (octet1 === 192 && octet2 === 168) {
          throw new BadRequestException("Access to private network is not allowed")
        }
        // 169.254.0.0/16 (link-local)
        if (octet1 === 169 && octet2 === 254) {
          throw new BadRequestException("Access to link-local addresses is not allowed")
        }
        // 127.0.0.0/8 (loopback)
        if (octet1 === 127) {
          throw new BadRequestException("Access to loopback addresses is not allowed")
        }
      }

      // Block IPv6 private addresses
      if (hostname.includes(":")) {
        const blockedIPv6Prefixes = [
          "fe80:", // link-local
          "fc00:", // unique local
          "fd00:", // unique local
          "::1",   // loopback
          "::ffff:127", // IPv4 mapped loopback
          "::ffff:10",  // IPv4 mapped private
          "::ffff:172.16", // IPv4 mapped private
          "::ffff:192.168", // IPv4 mapped private
        ]

        for (const prefix of blockedIPv6Prefixes) {
          if (hostname.startsWith(prefix)) {
            throw new BadRequestException("Access to private network is not allowed")
          }
        }
      }

      // Block metadata services (AWS, GCP, Azure, etc.)
      const blockedMetadataServices = [
        "169.254.169.254", // AWS, Azure, GCP metadata
        "metadata.google.internal",
        "metadata",
      ]

      if (blockedMetadataServices.includes(hostname)) {
        throw new BadRequestException("Access to metadata services is not allowed")
      }

    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException("Invalid URL format")
    }
  }

  private async validateAttachments(attachments: string[]): Promise<{ url: string; hash: string }[]> {
    const results: { url: string; hash: string }[] = []
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

    for (const url of attachments) {
      try {
        // Validate URL safety (SSRF protection)
        this.validateUrlSafety(url)

        // Download file with timeout and size limit
        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 30000, // 30 seconds timeout
          maxContentLength: MAX_FILE_SIZE,
          maxBodyLength: MAX_FILE_SIZE,
          validateStatus: (status) => status === 200, // Only accept 200 OK
        })

        // Validate Content-Type (should be image)
        const contentType = response.headers["content-type"]
        if (!contentType || !contentType.startsWith("image/")) {
          this.logger.warn(`Non-image content type detected: ${contentType} for URL: ${url}`)
          // Continue anyway, but log for monitoring
        }

        const buffer = Buffer.from(response.data)

        // Additional size check
        if (buffer.length > MAX_FILE_SIZE) {
          throw new BadRequestException(`File size exceeds maximum allowed size (50 MB)`)
        }

        // Calculate SHA256 hash
        const hash = createHash("sha256").update(buffer).digest("hex")

        results.push({ url, hash })
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error
        }
        this.logger.error(`Failed to process attachment: ${url}`, error)
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
    this.logger.log({
      message: "Looking for active deal",
      requestId: dto.requestId,
      performerId: user.id
    })
    
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

    this.logger.log({
      message: "Deal lookup result",
      dealFound: !!deal,
      requestId: dto.requestId
    })
    // Block new submission while previous one is pending customer review
    const latestSubmission = await this.submissionRepository.findOne({
      where: { request: { id: dto.requestId } },
      order: { serverTs: "DESC" },
    })
    if (latestSubmission?.status === SubmissionStatus.SUBMITTED) {
      throw new BadRequestException("Wait for customer to review the work before submitting again")
    }

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
        this.logger.log({
          message: "Deal found with incorrect status",
          requestId: dto.requestId,
          performerId: user.id,
          dealStatus: anyDeal.status
        })
        throw new BadRequestException("Deal is not in an active state for submission")
      }
      
      // Check if there are any deals for this request at all
      const requestDeals = await this.dealRepository.find({
        where: {
          request: { id: dto.requestId },
        },
        relations: ["performer", "chat"],
      })
      
      this.logger.log({
        message: "No active deal found for performer",
        requestId: dto.requestId,
        performerId: user.id,
        totalDeals: requestDeals.length
      })
      
      throw new BadRequestException("You are not authorized to submit work for this request")
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

      // Update Chat isActiveOrder = true and send in-chat notification so both sides see "Work submitted"
      // Вкладываем URL сданных файлов в сообщение, чтобы заказчик видел их прямо в чате (без перехода в блок задачи)
      if (deal.chat) {
        await this.chatService.updateIsActiveOrder(deal.chat.id, true)
        await this.chatService.sendMessage(user, deal.chat.id, {
          type: "notification",
          variant: "upload",
          requestId: request.id,
          responseId: deal.response?.id,
          attachments: attachmentHashes.map((a) => a.url),
        })
      }

      // Send push Notification to Customer
      await this.notificationService.send(String(request.customer.id), "notification", {
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

  /**
   * Check if user has access to view submission
   * User can view submission if they are:
   * - The performer who created it
   * - The customer of the request
   * @param user Current user
   * @param submission Submission to check access for
   * @throws ForbiddenException if user doesn't have access
   */
  private async checkSubmissionAccess(user: User, submission: Submission): Promise<void> {
    // Load request with customer if not already loaded
    if (!submission.request.customer) {
      const request = await this.requestRepository.findOne({
        where: { id: submission.request.id },
        relations: ["customer"],
      })

      if (!request) {
        throw new NotFoundException("Request not found")
      }

      submission.request = request
    }

    // Check if user is the performer
    const isPerformer = submission.performer.id === user.id

    // Check if user is the customer
    const isCustomer = submission.request.customer.id === user.id

    if (!isPerformer && !isCustomer) {
      throw new ForbiddenException("You don't have access to view this submission")
    }
  }

  async findOne(id: string, user: User): Promise<Submission> {
    this.validateUUID(id, "submission id")

    const submission = await this.submissionRepository.findOne({
      where: { id },
      relations: ["request", "request.customer", "performer", "attachments"],
    })

    if (!submission) {
      throw new NotFoundException("Submission not found")
    }

    // Check access rights
    await this.checkSubmissionAccess(user, submission)

    return submission
  }

  async findByRequest(requestId: string, user: User): Promise<Submission | null> {
    this.validateUUID(requestId, "requestId")

    // First, check if user has access to the request
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    const userId = String(user.id)
    const customerId = String(request.customer.id)

    const isCustomer = userId === customerId

    // Performer: в сделке по этому запросу или есть отклик (pending/accepted) по этому запросу
    let isPerformer = false
    if (!isCustomer) {
      const deal = await this.dealRepository.findOne({
        where: {
          request: { id: requestId },
          performer: { id: user.id },
        },
      })
      if (deal) {
        isPerformer = true
      } else {
        const response = await this.responseRepository.findOne({
          where: {
            request: { id: requestId },
            performer: { id: user.id },
          },
        })
        isPerformer = !!response
      }
    }

    if (!isCustomer && !isPerformer) {
      throw new ForbiddenException("You don't have access to view submissions for this request")
    }

    const submission = await this.submissionRepository.findOne({
      where: { request: { id: requestId } },
      relations: ["request", "request.customer", "performer", "attachments"],
      order: { serverTs: "DESC" },
    })

    return submission
  }

  /**
   * Reject the latest submission (customer only). Sends a chat notification so the performer sees it.
   */
  async reject(user: User, dto: RejectSubmissionDto): Promise<{ submission: Submission }> {
    this.validateUUID(dto.requestId, "requestId")

    const request = await this.requestRepository.findOne({
      where: { id: dto.requestId },
      relations: ["customer"],
    })
    if (!request) {
      throw new NotFoundException("Request not found")
    }
    if (request.customer.id !== user.id) {
      throw new ForbiddenException("Only the customer can reject the submission")
    }

    const latestSubmission = await this.submissionRepository.findOne({
      where: { request: { id: dto.requestId }, status: SubmissionStatus.SUBMITTED },
      relations: ["request", "performer"],
      order: { serverTs: "DESC" },
    })
    if (!latestSubmission) {
      throw new BadRequestException("No submission pending review for this request")
    }

    latestSubmission.status = SubmissionStatus.REJECTED
    await this.submissionRepository.save(latestSubmission)

    const deal = await this.dealRepository.findOne({
      where: { request: { id: dto.requestId } },
      relations: ["chat", "chat.user1", "chat.user2", "performer"],
    })
    if (deal?.chat) {
      await this.chatService.sendMessage(user, deal.chat.id, {
        type: "notification",
        variant: "submissionRejected",
        requestId: request.id,
      })
      await this.notificationService.send(String(deal.performer.id), "notification", {
        type: "notification",
        variant: "submissionRejected",
        requestId: request.id,
        text: "Заказчик отклонил сданную работу. Можно загрузить новую.",
      })
    }

    return { submission: latestSubmission }
  }
}