import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, DataSource } from "typeorm"
import { Request, Response, User, FileAttachment } from "@share/entities"
import { CreateRequestDto } from "./dto/create-request.dto"
import { ListRequestsDto } from "./dto/list-requests.dto"
import { UpdateRequestDto } from "./dto/update-request.dto"
import { RequestStatus } from "@share/request-status.enum"
import { EscrowHoldService } from "@ledger/escrow/escrow-hold.service"
import { Ledger } from "@ledger"
import { Token } from "@share/token.enum"
import { UserService } from "../user/user.service"
import { createHash } from 'crypto'
import axios from 'axios'

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(FileAttachment)
    private readonly fileAttachmentRepository: Repository<FileAttachment>,
    private readonly escrowHoldService: EscrowHoldService,
    private readonly ledger: Ledger,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  private async validateAttachments(attachments: string[]): Promise<{ url: string; hash: string }[]> {
    const results: { url: string; hash: string }[] = []

    for (const url of attachments) {
      try {
        // Download file
        const response = await axios.get(url, { responseType: 'arraybuffer' })
        const buffer = Buffer.from(response.data)

        // Calculate SHA256 hash
        const hash = createHash('sha256').update(buffer).digest('hex')

        results.push({ url, hash })
      } catch (error) {
        throw new BadRequestException(`Failed to process attachment: ${url}`)
      }
    }

    return results
  }

  async create(user: User, dto: CreateRequestDto): Promise<any> {
    // 1. Validate all fields (DTO validation handles most of this)

    // 2. Check user balance - only STARS are used for payment
    const balances = await this.userService.getBalances(user.id)
    console.log('User balances:', balances)
    
    // Filter all STARS balances (there might be multiple due to duplicate currencies)
    const starsBalances = balances.filter(b => b.token === Token.STARS && b.blockchain === null)
    if (starsBalances.length === 0) {
      throw new BadRequestException("User has no STARS balance")
    }

    // Sum all STARS balances to handle duplicate currency entries
    const totalBalance = starsBalances.reduce((sum, b) => sum + BigInt(b.balance), BigInt(0))
    const totalLocked = starsBalances.reduce((sum, b) => sum + BigInt(b.lockedBalance), BigInt(0))
    const availableBalance = totalBalance - totalLocked
    const priceInSmallestUnits = BigInt(Math.round(dto.price * 1e6))
    
    console.log('Total balance:', totalBalance.toString(), 'Locked:', totalLocked.toString(), 'Available:', availableBalance.toString(), 'Price needed:', priceInSmallestUnits.toString())
    
    if (availableBalance < priceInSmallestUnits) {
      throw new BadRequestException("Insufficient balance")
    }

    // 3. Validate attachments if provided
    let attachmentHashes: { url: string; hash: string }[] = []
    if (dto.attachments && dto.attachments.length > 0) {
      attachmentHashes = await this.validateAttachments(dto.attachments)
    }

    // 4. Get STARS currency for escrow
    const currency = await this.ledger.currency.retrieve({
      code: Token.STARS,
      blockchain: null,
    })

    if (!currency) {
      throw new BadRequestException("Currency not found")
    }

    // 5. Calculate expiresAt
    let expiresAt: Date | null = null
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt)
    } else if (dto.isUrgent && dto.deadlineAt) {
      expiresAt = new Date(dto.deadlineAt)
    } else if (!dto.isUrgent) {
      // Default: 168 hours (7 days) for non-urgent tasks
      expiresAt = new Date(Date.now() + 168 * 60 * 60 * 1000)
    }

    // 6. Wrap in transaction
    return this.dataSource.transaction(async (manager) => {
      // Create Request object with proper PostGIS Point mapping
      const request = this.requestRepository.create({
        title: dto.title,
        description: dto.description,
        price: dto.price,
        customer: user,
        status: RequestStatus.Published,
        // Map DTO location to PostGIS Point (longitude first!)
        location: {
          type: 'Point',
          coordinates: [dto.longitude, dto.latitude]
        },
        address: dto.address || null,
        metadata: dto.metadata || {},
        isUrgent: dto.isUrgent || false,
        deadlineAt: dto.deadlineAt ? new Date(dto.deadlineAt) : null,
        expiresAt,
      })

      // Save the Request
      const savedRequest = await manager.save(Request, request)

      // 7. Create FileAttachment records
      const attachments: any[] = []
      for (const attachment of attachmentHashes) {
        const fileAttachment = this.fileAttachmentRepository.create({
          url: attachment.url,
          hash: attachment.hash,
          request: savedRequest,
        })
        const savedAttachment = await manager.save(FileAttachment, fileAttachment)
        attachments.push({
          id: savedAttachment.id,
          url: savedAttachment.url,
          hash: savedAttachment.hash,
        })
      }

      // 8. Hold funds in escrow
      // Convert price to smallest currency unit (6 decimals for STARS)
      const amountInSmallestUnit = BigInt(Math.round(dto.price * 1e6))

      await this.escrowHoldService.hold(
        {
          externalType: "request",
          externalId: savedRequest.id,
          from: user.id,
          to: user.id, // Placeholder - funds go to escrow, actual recipient determined when request is accepted
          amount: amountInSmallestUnit,
          currencyId: currency.id,
        },
        manager
      )

      // 9. TODO: Schedule BullMQ job for auto-expiry if expiresAt is set
      // if (expiresAt) {
      //   // Add BullMQ job scheduling here
      // }

      // 10. TODO: Invalidate geo-cache
      // Add geo-cache invalidation here

      // 11. Return formatted response
      return {
        id: savedRequest.id,
        title: savedRequest.title,
        description: savedRequest.description,
        price: savedRequest.price,
        status: savedRequest.status,
        attachments,
        latitude: dto.latitude,
        longitude: dto.longitude,
        customer: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
        },
        performer: null,
        createdAt: savedRequest.createdAt.toISOString(),
        expiresAt: savedRequest.expiresAt?.toISOString() || null,
        deadlineAt: savedRequest.deadlineAt?.toISOString() || null,
        isUrgent: savedRequest.isUrgent,
        metadata: savedRequest.metadata,
      }
    })
  }

  async findAll(user: User, query: ListRequestsDto): Promise<any> {
    const {
      status,
      myTasks,
      north,
      south,
      east,
      west,
      radius,
      latitude,
      longitude,
      limit = 20,
      offset = 0,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = query

    // Clone for count query
    const countQueryBuilder = this.requestRepository.createQueryBuilder("request")
      .leftJoin("request.customer", "customer")
      .leftJoin("request.responses", "responses")
      .leftJoin("responses.performer", "performer")

    const queryBuilder = this.requestRepository.createQueryBuilder("request")
      .leftJoinAndSelect("request.customer", "customer")
      .leftJoinAndSelect("request.attachments", "attachments")
      .leftJoin("request.responses", "responses", "responses.status = :acceptedStatus", { acceptedStatus: "accepted" })
      .leftJoinAndSelect("responses.performer", "acceptedPerformer")

    // Filter by myTasks
    if (myTasks && user) {
      if (myTasks === "customer") {
        queryBuilder.andWhere("customer.id = :userId", { userId: user.id })
        countQueryBuilder.andWhere("customer.id = :userId", { userId: user.id })
      } else if (myTasks === "performer") {
        queryBuilder.andWhere("acceptedPerformer.id = :userId", { userId: user.id })
        countQueryBuilder.andWhere("performer.id = :userId", { userId: user.id })
      } else if (myTasks === "both") {
        queryBuilder.andWhere("(customer.id = :userId OR acceptedPerformer.id = :userId)", { userId: user.id })
        countQueryBuilder.andWhere("(customer.id = :userId OR performer.id = :userId)", { userId: user.id })
      }
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere("request.status = :status", { status })
      countQueryBuilder.andWhere("request.status = :status", { status })
    }

    // Bounding box filter
    if (north !== undefined && south !== undefined && east !== undefined && west !== undefined) {
      queryBuilder.andWhere("ST_Within(request.location, ST_MakeEnvelope(:west, :south, :east, :north, 4326))", {
        west, south, east, north
      })
      countQueryBuilder.andWhere("ST_Within(request.location, ST_MakeEnvelope(:west, :south, :east, :north, 4326))", {
        west, south, east, north
      })
    }

    // Radius filter
    if (radius && latitude !== undefined && longitude !== undefined) {
      queryBuilder.andWhere("ST_DWithin(request.location, ST_Point(:longitude, :latitude, 4326), :radius)", {
        longitude, latitude, radius: radius * 1000 // km to meters
      })
      countQueryBuilder.andWhere("ST_DWithin(request.location, ST_Point(:longitude, :latitude, 4326), :radius)", {
        longitude, latitude, radius: radius * 1000 // km to meters
      })
    }

    // Sorting
    const orderDirection = sortOrder.toUpperCase() as "ASC" | "DESC"
    if (sortBy === "distance" && latitude !== undefined && longitude !== undefined) {
      queryBuilder.addSelect("ST_Distance(request.location, ST_Point(:longitude, :latitude, 4326)) / 1000", "distance")
      queryBuilder.orderBy("distance", orderDirection)
    } else if (sortBy === "price") {
      queryBuilder.orderBy("request.price", orderDirection)
    } else {
      queryBuilder.orderBy("request.createdAt", orderDirection)
    }

    // Get total count
    const total = await countQueryBuilder.getCount()

    // Pagination
    queryBuilder.limit(limit).offset(offset)

    const requests = await queryBuilder.getMany()

    // Format response
    const items = requests.map(request => {
      const item: any = {
        id: request.id,
        title: request.title,
        description: request.description,
        price: request.price,
        status: request.status,
        attachments: request.attachments?.map(att => ({
          id: att.id,
          url: att.url,
          hash: att.hash,
        })) || [],
        latitude: request.location.coordinates[1],
        longitude: request.location.coordinates[0],
        customer: {
          id: request.customer.id,
          firstName: request.customer.firstName,
          lastName: request.customer.lastName,
          avatar: request.customer.avatar,
        },
        performer: request.responses?.[0]?.performer ? {
          id: request.responses[0].performer.id,
          firstName: request.responses[0].performer.firstName,
          lastName: request.responses[0].performer.lastName,
          avatar: request.responses[0].performer.avatar,
        } : null,
        createdAt: request.createdAt.toISOString(),
        expiresAt: request.expiresAt?.toISOString() || null,
        deadlineAt: request.deadlineAt?.toISOString() || null,
        isUrgent: request.isUrgent,
      }

      // Add distance if radius specified
      if (radius && latitude !== undefined && longitude !== undefined) {
        // Calculate distance in km
        // Note: This is approximate, ST_Distance returns meters
        item.distance = (request as any).distance || 0
      }

      // Add hoursLeft if deadlineAt exists
      if (request.deadlineAt) {
        const now = new Date()
        const hoursLeft = Math.max(0, Math.floor((request.deadlineAt.getTime() - now.getTime()) / (1000 * 60 * 60)))
        item.hoursLeft = hoursLeft
      }

      return item
    })

    return {
      items,
      total,
      limit,
      offset
    }
  }

  async findOne(id: string, user?: User): Promise<any> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ["customer", "responses", "responses.performer", "attachments", "submissions"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    const isCustomer = user && request.customer.id === user.id
    const isPerformer = user && request.responses.some(r => r.performer.id === user.id)
    const isPublishedOrAccepted = request.status === RequestStatus.Published || request.status === RequestStatus.Accepted

    // Filter responses based on user role
    let responses: any[] = []
    if (isCustomer && isPublishedOrAccepted) {
      // Show all responses
      responses = request.responses.map(r => ({
        id: r.id,
        performer: {
          id: r.performer.id,
          firstName: r.performer.firstName,
          lastName: r.performer.lastName,
          avatar: r.performer.avatar,
        },
        status: r.status,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      }))
    } else if (isPerformer && isPublishedOrAccepted) {
      // Show only own response
      const ownResponse = request.responses.find(r => r.performer.id === user!.id)
      if (ownResponse) {
        responses = [{
          id: ownResponse.id,
          performer: {
            id: ownResponse.performer.id,
            firstName: ownResponse.performer.firstName,
            lastName: ownResponse.performer.lastName,
            avatar: ownResponse.performer.avatar,
          },
          status: ownResponse.status,
          message: ownResponse.message,
          createdAt: ownResponse.createdAt.toISOString(),
        }]
      }
    }
    // For others, no responses

    // Filter submissions - placeholder since entity doesn't have required fields
    let submission: any = null
    // TODO: Implement submission logic when entity is updated

    // Find performer (accepted one)
    const acceptedResponse = request.responses.find(r => r.status === "accepted")
    const performer = acceptedResponse ? {
      id: acceptedResponse.performer.id,
      firstName: acceptedResponse.performer.firstName,
      lastName: acceptedResponse.performer.lastName,
      avatar: acceptedResponse.performer.avatar,
    } : null

    return {
      id: request.id,
      title: request.title,
      description: request.description,
      price: request.price,
      status: request.status,
      attachments: request.attachments?.map(att => ({
        id: att.id,
        url: att.url,
        hash: att.hash,
      })) || [],
      latitude: request.location.coordinates[1],
      longitude: request.location.coordinates[0],
      customer: {
        id: request.customer.id,
        firstName: request.customer.firstName,
        lastName: request.customer.lastName,
        avatar: request.customer.avatar,
      },
      performer,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      acceptedAt: request.acceptedAt?.toISOString() || null,
      completedAt: request.completedAt?.toISOString() || null,
      cancelledAt: request.cancelledAt?.toISOString() || null,
      expiresAt: request.expiresAt?.toISOString() || null,
      deadlineAt: request.deadlineAt?.toISOString() || null,
      isUrgent: request.isUrgent,
      metadata: request.metadata,
      responses,
      submission,
    }
  }

  async findRequestResponses(requestId: string): Promise<Response[]> {
    // First, verify the request exists
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // Return all responses for this request
    return this.responseRepository.find({
      where: { request: { id: requestId } },
      relations: ["performer"],
      order: { createdAt: "DESC" },
    })
  }

  async update(user: User, id: string, dto: UpdateRequestDto): Promise<any> {
    // 1. Find the request
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // 2. Check if status is draft
    if (request.status !== RequestStatus.Draft) {
      throw new BadRequestException("Only draft requests can be updated")
    }

    // 3. Check if user is the customer
    if (request.customer.id !== user.id) {
      throw new BadRequestException("Only the customer can update the request")
    }

    // 4. Prepare update data
    const updateData: any = {}

    if (dto.title !== undefined) updateData.title = dto.title
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.price !== undefined) updateData.price = dto.price
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude]
      }
    }
    if (dto.address !== undefined) updateData.address = dto.address
    if (dto.metadata !== undefined) updateData.metadata = dto.metadata
    if (dto.isUrgent !== undefined) updateData.isUrgent = dto.isUrgent
    if (dto.deadlineAt !== undefined) updateData.deadlineAt = dto.deadlineAt ? new Date(dto.deadlineAt) : null
    if (dto.expiresAt !== undefined) updateData.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null

    // 5. Handle price change - re-hold funds in escrow
    if (dto.price !== undefined && dto.price !== request.price) {
      // Check user balance - only STARS are used for payment
      const balances = await this.userService.getBalances(user.id)
      const starsBalances = balances.filter(b => b.token === Token.STARS && b.blockchain === null)
      if (starsBalances.length === 0) {
        throw new BadRequestException("User has no STARS balance")
      }

      // Sum all STARS balances to handle duplicate currency entries
      const totalBalance = starsBalances.reduce((sum, b) => sum + BigInt(b.balance), BigInt(0))
      const totalLocked = starsBalances.reduce((sum, b) => sum + BigInt(b.lockedBalance), BigInt(0))
      const availableBalance = totalBalance - totalLocked
      const priceInSmallestUnits = BigInt(Math.round(dto.price * 1e6))
      if (availableBalance < priceInSmallestUnits) {
        throw new BadRequestException("Insufficient balance")
      }

      // Get STARS currency
      const currency = await this.ledger.currency.retrieve({
        code: Token.STARS,
        blockchain: null,
      })

      if (!currency) {
        throw new BadRequestException("Currency not found")
      }

      // Re-hold funds
      const amountInSmallestUnit = BigInt(Math.round(dto.price * 1e6))

      await this.escrowHoldService.hold(
        {
          externalType: "request",
          externalId: request.id,
          from: user.id,
          to: user.id,
          amount: amountInSmallestUnit,
          currencyId: currency.id,
        },
        this.dataSource.manager
      )
    }

    // 6. Handle attachments update
    if (dto.attachments !== undefined) {
      // Validate new attachments
      let attachmentHashes: { url: string; hash: string }[] = []
      if (dto.attachments && dto.attachments.length > 0) {
        attachmentHashes = await this.validateAttachments(dto.attachments)
      }

      // Remove old attachments
      await this.fileAttachmentRepository.delete({ request: { id } })

      // Add new attachments
      for (const attachment of attachmentHashes) {
        const fileAttachment = this.fileAttachmentRepository.create({
          url: attachment.url,
          hash: attachment.hash,
          request,
        })
        await this.dataSource.manager.save(FileAttachment, fileAttachment)
      }
    }

    // 7. Update the request
    await this.requestRepository.update(id, updateData)

    // 8. TODO: Invalidate geo-cache

    // 9. Return updated request
    return this.findOne(id, user)
  }

  async delete(user: User, id: string): Promise<void> {
    // 1. Find the request
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // 2. Check if status is draft
    if (request.status !== RequestStatus.Draft) {
      throw new BadRequestException("Only draft requests can be deleted")
    }

    // 3. Check if user is the customer
    if (request.customer.id !== user.id) {
      throw new BadRequestException("Only the customer can delete the request")
    }

    // 4. Wrap in transaction
    return this.dataSource.transaction(async (manager) => {
      // Refund escrow
      await this.ledger.escrow.refund(
        {
          externalType: "request",
          externalId: id,
        },
        manager
      )

      // Delete attachments
      await manager.delete(FileAttachment, { request: { id } })

      // Delete responses
      await manager.delete(Response, { request: { id } })

      // Delete the request
      await manager.delete(Request, { id })
    })
  }
}