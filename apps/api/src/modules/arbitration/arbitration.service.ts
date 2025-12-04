import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, DataSource } from "typeorm"
import { Arbitration, Request, Deal, User, Chat } from "@share/entities"
import { RequestStatus } from "@share/request-status.enum"
import { DealStatus } from "@share/deal-status.enum"
import { Role } from "@share/role.enum"
import { CreateArbitrationDto } from "./dto/create-arbitration.dto"
import { ListArbitrationsDto } from "./dto/list-arbitrations.dto"
import { ResolveArbitrationDto } from "./dto/resolve-arbitration.dto"
import { ChatService } from "../chat/chat.service"
import { NotificationService } from "../notification/notification.service"
import { Ledger } from "@ledger"
import { Account, AccountOwnerType, AccountPurpose, Transaction, TransactionType } from "@ledger/entities"

@Injectable()
export class ArbitrationService {
  private readonly logger = new Logger(ArbitrationService.name)

  constructor(
    @InjectRepository(Arbitration)
    private readonly arbitrationRepository: Repository<Arbitration>,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    private readonly dataSource: DataSource,
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
    private readonly ledger: Ledger,
  ) {}

  async create(user: User, dto: CreateArbitrationDto): Promise<any> {
    // 1. Get request with all relations
    const request = await this.requestRepository.findOne({
      where: { id: dto.requestId },
      relations: ["customer", "responses", "responses.performer", "deals", "deals.performer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // 2. Check if request is in accepted or in_progress status
    if (request.status !== RequestStatus.Accepted && request.status !== RequestStatus.InProgress) {
      throw new BadRequestException("Arbitration can only be created for tasks in accepted or in_progress status")
    }

    // 3. Check rights - user must be customer or performer
    const isCustomer = request.customer.id === user.id
    const acceptedResponse = request.responses?.find(r => r.status === "accepted")
    const isPerformer = acceptedResponse && acceptedResponse.performer.id === user.id

    if (!isCustomer && !isPerformer) {
      throw new ForbiddenException("Only customer or performer can create arbitration")
    }

    // 4. Check if arbitration already exists for this request
    const existingArbitration = await this.arbitrationRepository.findOne({
      where: { request: { id: dto.requestId }, status: "pending" },
    })

    if (existingArbitration) {
      throw new BadRequestException("Arbitration already exists for this request")
    }

    // 5. Get the other party for chat
    const otherUserId = isCustomer ? acceptedResponse!.performer.id : request.customer.id

    // 6. Transaction to create arbitration and update related entities
    return this.dataSource.transaction(async (manager) => {
      // Get or create chat between customer and performer
      const chat = await this.chatService.getOrCreateChat(request.customer.id, otherUserId)

      // Update chat to mark as arbitration
      chat.isArbitration = true
      await manager.save(Chat, chat)

      // Update request status to arbitration
      request.status = RequestStatus.Arbitration
      await manager.save(Request, request)

      // Create arbitration record
      const arbitration = this.arbitrationRepository.create({
        request,
        chat,
        initiator: user,
        reason: dto.reason,
        attachments: dto.attachments || null,
        status: "pending",
      })
      const savedArbitration = await manager.save(Arbitration, arbitration)

      // Send message to chat with arbitration details
      await this.chatService.sendMessage(user, chat.id, {
        text: `Arbitration initiated: ${dto.reason}`,
        type: "notification",
        variant: "arbitration",
        attachments: dto.attachments,
      })

      // Notify admin through queue
      await this.notificationService.send("admin", "arbitrationCreated", {
        arbitrationId: savedArbitration.id,
        requestId: request.id,
        reason: dto.reason,
        initiatorId: user.id,
        chatId: chat.id,
      })

      return {
        id: savedArbitration.id,
        requestId: request.id,
        chatId: chat.id,
        status: "pending",
        createdAt: savedArbitration.createdAt.toISOString(),
      }
    })
  }

  async findAll(query: ListArbitrationsDto): Promise<any> {
    const { status, limit = 20, offset = 0 } = query

    const qb = this.arbitrationRepository.createQueryBuilder("arbitration")
      .leftJoinAndSelect("arbitration.request", "request")
      .leftJoinAndSelect("request.customer", "customer")
      .leftJoinAndSelect("arbitration.chat", "chat")
      .leftJoinAndSelect("chat.user1", "user1")
      .leftJoinAndSelect("chat.user2", "user2")
      .leftJoinAndSelect("arbitration.initiator", "initiator")
      .leftJoinAndSelect("arbitration.resolvedBy", "resolvedBy")

    if (status) {
      qb.andWhere("arbitration.status = :status", { status })
    }

    qb.orderBy("arbitration.createdAt", "DESC")

    const [items, total] = await qb
      .take(limit)
      .skip(offset)
      .getManyAndCount()

    const formattedItems = items.map(arb => ({
      id: arb.id,
      request: {
        id: arb.request.id,
        title: arb.request.title,
        description: arb.request.description,
        price: arb.request.price,
        status: arb.request.status,
        customer: {
          id: arb.request.customer.id,
          firstName: arb.request.customer.firstName,
          lastName: arb.request.customer.lastName,
          avatar: arb.request.customer.avatar,
        },
      },
      chat: {
        id: arb.chat.id,
        isArbitration: arb.chat.isArbitration,
      },
      reason: arb.reason,
      attachments: arb.attachments,
      status: arb.status,
      resolution: arb.resolution,
      adminMessage: arb.adminMessage,
      initiator: {
        id: arb.initiator.id,
        firstName: arb.initiator.firstName,
        lastName: arb.initiator.lastName,
        avatar: arb.initiator.avatar,
      },
      resolvedBy: arb.resolvedBy ? {
        id: arb.resolvedBy.id,
        firstName: arb.resolvedBy.firstName,
        lastName: arb.resolvedBy.lastName,
      } : null,
      createdAt: arb.createdAt.toISOString(),
      resolvedAt: arb.resolvedAt?.toISOString() || null,
    }))

    return {
      items: formattedItems,
      total,
    }
  }

  async resolve(admin: User, arbitrationId: string, dto: ResolveArbitrationDto): Promise<any> {
    // 1. Check admin rights
    if (admin.role !== Role.Admin) {
      throw new ForbiddenException("Only admin can resolve arbitration")
    }

    // 2. Get arbitration with all relations
    const arbitration = await this.arbitrationRepository.findOne({
      where: { id: arbitrationId },
      relations: [
        "request",
        "request.customer",
        "request.deals",
        "request.deals.performer",
        "chat",
        "chat.user1",
        "chat.user2",
      ],
    })

    if (!arbitration) {
      throw new NotFoundException("Arbitration not found")
    }

    if (arbitration.status === "resolved") {
      throw new BadRequestException("Arbitration already resolved")
    }

    const request = arbitration.request

    // 3. Find the active deal
    const activeDeal = request.deals?.find(
      deal => deal.status === DealStatus.Accepted || deal.status === DealStatus.InProgress
    )

    if (!activeDeal) {
      throw new BadRequestException("No active deal found for this request")
    }

    // 4. Transaction to handle resolution
    return this.dataSource.transaction(async (manager) => {
      let messageText = ""

      if (dto.action === "approve_cancel") {
        // Approve cancellation - update deal
        activeDeal.arbitrationApproved = true
        await manager.save(Deal, activeDeal)

        messageText = dto.message || "Admin approved cancellation. Customer can now cancel the task."

        // Notify customer they can cancel
        await this.notificationService.send(request.customer.id, "permissionToCancel", {
          requestId: request.id,
          arbitrationId: arbitration.id,
          message: messageText,
        })

        // Send WebSocket order status change event to customer
        this.chatService.notifyOrderStatusChanged(request.customer.id, request.id, RequestStatus.Arbitration)

      } else if (dto.action === "complete") {
        // Complete task - release funds to performer
        const performer = activeDeal.performer

        // Get performer's account
        let performerAccount = await manager.findOne(Account, {
          where: {
            ownerId: performer.id.toString(),
            ownerType: AccountOwnerType.User,
          },
        })

        if (!performerAccount) {
          // Create account for performer if it doesn't exist
          const accountInsertResult = await manager
            .createQueryBuilder()
            .insert()
            .into(Account)
            .values({
              purpose: AccountPurpose.Main,
              ownerType: AccountOwnerType.User,
              ownerId: performer.id.toString(),
            })
            .returning('*')
            .execute()
          
          performerAccount = manager.create(Account, accountInsertResult.raw[0] as object)
        }

        // Get the hold transaction
        const holdTransaction = await manager.findOne(Transaction, {
          where: {
            type: TransactionType.EscrowHold,
            externalType: 'request',
            externalId: request.id,
          },
        })

        if (!holdTransaction) {
          throw new BadRequestException("Escrow hold transaction not found")
        }

        // Update the hold transaction metadata to set the correct recipient
        const updatedMeta = {
          ...holdTransaction.meta,
          to: performerAccount.id,
        }
        
        await manager.update(Transaction,
          { id: holdTransaction.id },
          { meta: updatedMeta as any }
        )

        // Release funds to performer
        await this.ledger.escrow.release(
          {
            externalType: "request",
            externalId: request.id,
          },
          manager
        )

        // Update request status
        request.status = RequestStatus.Completed
        request.completedAt = new Date()
        await manager.save(Request, request)

        // Update deal status
        activeDeal.status = DealStatus.Completed
        activeDeal.escrowStatus = "released"
        await manager.save(Deal, activeDeal)

        messageText = dto.message || "Admin completed the task. Funds released to performer."

        // Notify both parties
        await this.notificationService.send(request.customer.id, "arbitrationResolved", {
          requestId: request.id,
          resolution: "complete",
          message: messageText,
        })

        await this.notificationService.send(performer.id, "taskCompleted", {
          requestId: request.id,
          message: "Task completed by admin. Funds released.",
        })

        // Send WebSocket order status change event
        this.chatService.notifyOrderStatusChanged(request.customer.id, request.id, RequestStatus.Completed)
        this.chatService.notifyOrderStatusChanged(performer.id, request.id, RequestStatus.Completed)

      } else if (dto.action === "reject") {
        // Reject arbitration - task stays in current status
        messageText = dto.message || "Admin rejected the arbitration. Task continues in current status."

        // Notify both parties
        await this.notificationService.send(request.customer.id, "arbitrationResolved", {
          requestId: request.id,
          resolution: "reject",
          message: messageText,
        })

        await this.notificationService.send(activeDeal.performer.id, "arbitrationResolved", {
          requestId: request.id,
          resolution: "reject",
          message: messageText,
        })

        // Send WebSocket order status change event to both parties
        this.chatService.notifyOrderStatusChanged(request.customer.id, request.id, request.status)
        this.chatService.notifyOrderStatusChanged(activeDeal.performer.id, request.id, request.status)
      }

      // Send message to chat with admin's decision
      await this.chatService.sendMessage(admin, arbitration.chat.id, {
        text: messageText,
        type: "notification",
        variant: "adminDecision",
      })

      // Update arbitration status
      arbitration.status = "resolved"
      arbitration.resolution = dto.action
      arbitration.adminMessage = dto.message || null
      arbitration.resolvedBy = admin
      arbitration.resolvedAt = new Date()
      await manager.save(Arbitration, arbitration)

      return {
        id: arbitration.id,
        status: "resolved",
        action: dto.action,
        request: {
          id: request.id,
          status: request.status,
        },
      }
    })
  }
}