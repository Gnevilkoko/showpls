import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository } from "typeorm"
import { Deal, Request, Response, User } from "@share/entities"
import { CreateDealDto } from "./dto/create-deal.dto"
import { ListDealsDto } from "./dto/list-deals.dto"
import { DealStatus } from "@share/deal-status.enum"
import { RequestStatus } from "@share/request-status.enum"
import { ChatService } from "../chat/chat.service"
import { ChatGateway } from "../chat/chat.gateway"

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    private readonly dataSource: DataSource,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  async create(user: User, dto: CreateDealDto): Promise<Deal> {
    // 1. Check if Request exists
    const request = await this.requestRepository.findOne({
      where: { id: dto.requestId },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // 2. Check if Request status is PUBLISHED
    if (request.status !== RequestStatus.Published) {
      throw new BadRequestException("Request is not published")
    }

    // 3. Check if User is the Customer (only customer can accept a response)
    if (request.customer.id !== user.id) {
      throw new ForbiddenException("Only the customer can create a deal")
    }

    // 4. Check if Response exists and belongs to this Request
    const response = await this.responseRepository.findOne({
      where: { id: dto.responseId, request: request },
      relations: ["performer"],
    })

    if (!response) {
      throw new NotFoundException("Response not found")
    }

    // 5. Check if a deal already exists for this response
    const existingDeal = await this.dealRepository.findOne({
      where: { response: { id: response.id } },
    })

    if (existingDeal) {
      throw new BadRequestException("A deal already exists for this response")
    }

    // 6. Create Deal in a transaction
    return this.dataSource.transaction(async (manager) => {
      // Get or create chat
      const chat = await this.chatService.getOrCreateChat(request.customer.id, response.performer.id)

      // Create Deal
      const deal = this.dealRepository.create({
        customer: request.customer,
        performer: response.performer,
        request,
        response,
        chat,
        status: DealStatus.Accepted,
        escrowStatus: dto.escrowStatus,
        arbitrationApproved: dto.arbitrationApproved,
      })
      const savedDeal = await manager.save(Deal, deal)

      // Update Request Status to Accepted
      request.status = RequestStatus.Accepted
      await manager.save(Request, request)

      // Notify about order status change via WebSocket
      this.chatGateway.notifyOrderStatusChanged(request.customer.id, request.id, RequestStatus.Accepted)
      this.chatGateway.notifyOrderStatusChanged(response.performer.id, request.id, RequestStatus.Accepted)

      // Update chat to mark as active order
      chat.isActiveOrder = true
      await this.chatService.updateChat(chat)

      return savedDeal
    })
  }

  async findAll(): Promise<Deal[]> {
    return this.dealRepository.find({
      relations: ["request", "response", "request.customer", "response.performer", "chat"],
      order: { createdAt: "DESC" },
    })
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id },
      relations: ["request", "response", "request.customer", "response.performer", "chat"],
    })

    if (!deal) {
      throw new NotFoundException("Deal not found")
    }

    return deal
  }

  async findByUserId(userId: string): Promise<Deal[]> {
    return this.dealRepository.find({
      where: [
        { request: { customer: { id: userId } } },
        { response: { performer: { id: userId } } },
      ],
      relations: ["request", "response", "request.customer", "response.performer", "chat"],
      order: { createdAt: "DESC" },
    })
  }

  async findAllForUser(user: User, query: ListDealsDto): Promise<{ items: Deal[], total: number }> {
    const qb = this.dealRepository.createQueryBuilder('deal')
      .leftJoinAndSelect('deal.request', 'request')
      .leftJoinAndSelect('deal.response', 'response')
      .leftJoinAndSelect('request.customer', 'customer')
      .leftJoinAndSelect('response.performer', 'performer')
      .leftJoinAndSelect('deal.chat', 'chat')

    // Filter by user role
    if (query.myRole === 'customer') {
      qb.andWhere('customer.id = :userId', { userId: user.id })
    } else if (query.myRole === 'performer') {
      qb.andWhere('performer.id = :userId', { userId: user.id })
    } else {
      // both
      qb.andWhere('(customer.id = :userId OR performer.id = :userId)', { userId: user.id })
    }

    // Filter by status
    if (query.status) {
      qb.andWhere('deal.status = :status', { status: query.status })
    }

    // Order
    qb.orderBy('deal.createdAt', 'DESC')

    // Count total
    const total = await qb.getCount()

    // Pagination
    qb.take(query.limit || 20)
    qb.skip(query.offset || 0)

    const items = await qb.getMany()

    return { items, total }
  }
}