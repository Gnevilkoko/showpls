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
    // Convert IDs to strings for comparison to handle bigint/string mismatch
    const isCustomer = String(request.customer.id) === String(user.id)
    const acceptedResponse = request.responses?.find(r => r.status === "accepted")
    const isPerformer = acceptedResponse && String(acceptedResponse.performer.id) === String(user.id)

    this.logger.debug(`Arbitration creation check - User ID: ${user.id}, Customer ID: ${request.customer.id}, isCustomer: ${isCustomer}, isPerformer: ${isPerformer}`)
    
    if (acceptedResponse) {
      this.logger.debug(`Accepted response found - Performer ID: ${acceptedResponse.performer.id}`)
    }

    if (!isCustomer && !isPerformer) {
      this.logger.error(`Access denied for user ${user.id} to create arbitration for request ${dto.requestId}`)
      throw new ForbiddenException("Only customer or performer can create arbitration")
    }

    this.logger.debug(`Permission check passed - proceeding with arbitration creation`)

    // 4. Check if arbitration already exists for this request
    const existingArbitration = await this.arbitrationRepository.findOne({
      where: { request: { id: dto.requestId }, status: "pending" },
    })

    if (existingArbitration) {
      this.logger.warn(`Arbitration already exists for request ${dto.requestId}`)
      throw new BadRequestException("Arbitration already exists for this request")
    }

    // 5. Get the other party for chat
    if (!acceptedResponse) {
      throw new BadRequestException("No accepted response found for this request")
    }
    const otherUserId = isCustomer ? acceptedResponse.performer.id : request.customer.id
    this.logger.debug(`Creating arbitration - other party ID: ${otherUserId}`)

    // 6. Transaction to create arbitration and update related entities
    return this.dataSource.transaction(async (manager) => {
      this.logger.debug(`Starting transaction for arbitration creation`)
      
      // Get or create chat between customer and performer
      const performerId = acceptedResponse.performer.id
      this.logger.debug(`Getting/creating chat between ${request.customer.id} and ${performerId}`)
      const chat = await this.chatService.getOrCreateChat(request.customer.id, performerId, manager as any)
      this.logger.debug(`Chat obtained: ${chat.id}`)

      // Update chat to mark as arbitration
      this.logger.debug(`Updating chat ${chat.id} to mark as arbitration`)
      chat.isArbitration = true
      await manager.save(Chat, chat)
      this.logger.debug(`Chat updated successfully`)

      // Get the active deal for escrow status
      const activeDeal = request.deals?.find(
        deal => deal.status === DealStatus.Accepted || deal.status === DealStatus.InProgress
      )
      const escrowStatus = activeDeal?.escrowStatus || "locked"
      this.logger.debug(`Active deal found: ${activeDeal?.id}, escrowStatus: ${escrowStatus}`)

      // Update request status to arbitration
      this.logger.debug(`Updating request ${request.id} status to arbitration`)
      request.status = RequestStatus.Arbitration
      await manager.save(Request, request)
      this.logger.debug(`Request status updated successfully`)

      // Create arbitration record
      this.logger.debug(`Creating arbitration record`)
      const arbitration = this.arbitrationRepository.create({
        request,
        chat,
        initiator: user,
        reason: dto.reason,
        attachments: dto.attachments || null,
        status: "pending",
      })
      const savedArbitration = await manager.save(Arbitration, arbitration)
      this.logger.debug(`Arbitration saved with ID: ${savedArbitration.id}`)

      // Send system message to chat (no specific variant in schema for arbitration creation)
      this.logger.debug(`Sending system message to chat`)
      try {
        await this.chatService.sendMessage(user, chat.id, {
          text: `Arbitration initiated: ${dto.reason}`,
          type: "notification",
          variant: null,
          attachments: dto.attachments,
        }, manager as any)
        this.logger.debug(`System message sent successfully`)
      } catch (error) {
        this.logger.error(`Error sending system message: ${error instanceof Error ? error.message : String(error)}`)
        throw error
      }

      // Find admin user to notify
      const adminUser = await this.dataSource.getRepository(User).findOne({
        where: { role: Role.Admin }
      })
      
      if (adminUser) {
        this.logger.log(`Found admin user with ID: ${adminUser.id}`)
        // Notify admin through queue - ensure we pass the numeric ID as string
        await this.notificationService.send(String(adminUser.id), "arbitrationCreated", {
          arbitrationId: savedArbitration.id,
          requestId: request.id,
          reason: dto.reason,
          initiatorId: user.id.toString(),
          chatId: chat.id,
        })
      } else {
        this.logger.warn('No admin user found to notify about arbitration')
      }

      // Send WebSocket order:status_changed event to both parties
      this.chatService.notifyOrderStatusChanged(
        request.customer.id,
        request.id,
        RequestStatus.Arbitration,
        chat.id,
        escrowStatus
      )
      
      if (acceptedResponse) {
        this.chatService.notifyOrderStatusChanged(
          acceptedResponse.performer.id,
          request.id,
          RequestStatus.Arbitration,
          chat.id,
          escrowStatus
        )
      }

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

  async findOne(arbitrationId: string, user: User): Promise<any> {
    // 1. Get arbitration with all relations
    const arbitration = await this.arbitrationRepository.findOne({
      where: { id: arbitrationId },
      relations: [
        "request",
        "request.customer",
        "request.responses",
        "request.responses.performer",
        "chat",
        "chat.user1",
        "chat.user2",
        "initiator",
        "resolvedBy",
      ],
    })

    if (!arbitration) {
      throw new NotFoundException("Arbitration not found")
    }

    // 2. Check access rights - user must be participant (customer, performer) or admin
    const isCustomer = arbitration.request.customer.id === user.id
    const acceptedResponse = arbitration.request.responses?.find(r => r.status === "accepted")
    const isPerformer = acceptedResponse && acceptedResponse.performer.id === user.id
    const isAdmin = user.role === Role.Admin

    if (!isCustomer && !isPerformer && !isAdmin) {
      throw new ForbiddenException("Access denied to this arbitration")
    }

    // 3. Format response
    return {
      id: arbitration.id,
      request: {
        id: arbitration.request.id,
        title: arbitration.request.title,
        description: arbitration.request.description,
        price: arbitration.request.price,
        status: arbitration.request.status,
        customer: {
          id: arbitration.request.customer.id,
          firstName: arbitration.request.customer.firstName,
          lastName: arbitration.request.customer.lastName,
          avatar: arbitration.request.customer.avatar,
        },
      },
      chat: {
        id: arbitration.chat.id,
        isArbitration: arbitration.chat.isArbitration,
      },
      reason: arbitration.reason,
      attachments: arbitration.attachments,
      status: arbitration.status,
      resolution: arbitration.resolution,
      adminMessage: arbitration.adminMessage,
      initiator: {
        id: arbitration.initiator.id,
        firstName: arbitration.initiator.firstName,
        lastName: arbitration.initiator.lastName,
        avatar: arbitration.initiator.avatar,
      },
      resolvedBy: arbitration.resolvedBy ? {
        id: arbitration.resolvedBy.id,
        firstName: arbitration.resolvedBy.firstName,
        lastName: arbitration.resolvedBy.lastName,
      } : null,
      createdAt: arbitration.createdAt.toISOString(),
      resolvedAt: arbitration.resolvedAt?.toISOString() || null,
    }
  }

  async resolve(admin: User, arbitrationId: string, dto: ResolveArbitrationDto): Promise<any> {
    // Admin rights are already verified by AdminGuard in controller
    // No need for duplicate check here as it can cause issues with plainToInstance transformation
    
    // 1. Get arbitration with all relations
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
      let messageVariant: "permissionToCancel" | "taskCompleted" | "taskCancelled" | null = null

      if (dto.action === "approve_cancel") {
        // Approve cancellation - update deal
        activeDeal.arbitrationApproved = true
        await manager.save(Deal, activeDeal)

        messageText = dto.message || "Admin approved cancellation. Customer can now cancel the task."
        messageVariant = "permissionToCancel"

        // Notify customer they can cancel
        await this.notificationService.send(String(request.customer.id), "permissionToCancel", {
          requestId: request.id,
          arbitrationId: arbitration.id,
          message: messageText,
        })

        // Send WebSocket order status change event to both parties with complete info
        this.chatService.notifyOrderStatusChanged(
          request.customer.id,
          request.id,
          RequestStatus.Arbitration,
          arbitration.chat.id,
          activeDeal.escrowStatus
        )
        this.chatService.notifyOrderStatusChanged(
          activeDeal.performer.id,
          request.id,
          RequestStatus.Arbitration,
          arbitration.chat.id,
          activeDeal.escrowStatus
        )

      } else if (dto.action === "complete") {
        // Complete task - release funds to performer
        const performer = activeDeal.performer

        // First, check if escrow exists
        const holdTransaction = await manager.findOne(Transaction, {
          where: {
            type: TransactionType.EscrowHold,
            externalType: 'request',
            externalId: request.id,
          },
          relations: ['entries'],
        })

        if (!holdTransaction) {
          this.logger.error(`Cannot complete arbitration ${arbitrationId}: No escrow hold transaction found for request ${request.id}`)
          throw new BadRequestException(
            `Cannot complete this arbitration - no escrow transaction found. ` +
            `This request (${request.id}) may not have properly accepted response with escrow setup. ` +
            `Deal status: ${activeDeal.status}, Deal escrowStatus: ${activeDeal.escrowStatus || 'none'}`
          )
        }

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

        if (!holdTransaction.entries || holdTransaction.entries.length === 0) {
          throw new BadRequestException("Hold transaction has no entries")
        }

        // Get the currency from the hold transaction
        const currencyId = holdTransaction.entries[0].currencyId
        if (!currencyId) {
          throw new BadRequestException("Currency not found in hold transaction")
        }

        // Ensure balance exists for performer
        const Balance = manager.getRepository('Balance')
        let performerBalance = await Balance.findOne({
          where: {
            accountId: performerAccount.id,
            currencyId: currencyId,
          },
        })

        if (!performerBalance) {
          // Create balance for performer
          await manager
            .createQueryBuilder()
            .insert()
            .into('balance')
            .values({
              accountId: performerAccount.id,
              currencyId: currencyId,
              amount: '0',
              lockedAmount: '0',
              updatedAt: new Date(),
              createdAt: new Date(),
            })
            .execute()
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
        messageVariant = "taskCompleted"

        // Notify both parties
        await this.notificationService.send(String(request.customer.id), "arbitrationResolved", {
          requestId: request.id,
          resolution: "complete",
          message: messageText,
        })

        await this.notificationService.send(String(performer.id), "taskCompleted", {
          requestId: request.id,
          message: "Task completed by admin. Funds released.",
        })

        // Send WebSocket order status change event with complete info
        this.chatService.notifyOrderStatusChanged(
          request.customer.id,
          request.id,
          RequestStatus.Completed,
          arbitration.chat.id,
          "released"
        )
        this.chatService.notifyOrderStatusChanged(
          performer.id,
          request.id,
          RequestStatus.Completed,
          arbitration.chat.id,
          "released"
        )

      } else if (dto.action === "reject") {
        // Reject arbitration - task stays in current status
        messageText = dto.message || "Admin rejected the arbitration. Task continues in current status."
        messageVariant = null

        // Notify both parties
        await this.notificationService.send(String(request.customer.id), "arbitrationResolved", {
          requestId: request.id,
          resolution: "reject",
          message: messageText,
        })

        await this.notificationService.send(String(activeDeal.performer.id), "arbitrationResolved", {
          requestId: request.id,
          resolution: "reject",
          message: messageText,
        })

        // Send WebSocket order status change event to both parties with complete info
        this.chatService.notifyOrderStatusChanged(
          request.customer.id,
          request.id,
          request.status,
          arbitration.chat.id,
          activeDeal.escrowStatus
        )
        this.chatService.notifyOrderStatusChanged(
          activeDeal.performer.id,
          request.id,
          request.status,
          arbitration.chat.id,
          activeDeal.escrowStatus
        )
      }

      // Send message to chat with admin's decision using the appropriate variant
      await this.chatService.sendMessage(admin, arbitration.chat.id, {
        text: messageText,
        type: "notification",
        variant: messageVariant,
      }, manager as any)

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