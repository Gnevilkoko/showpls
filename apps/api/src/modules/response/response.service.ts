import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository, DataSource } from "typeorm"
import { Response, Request, User, Deal } from "@share/entities"
import { CreateResponseDto } from "./dto/create-response.dto"
import { AcceptResponseDto } from "./dto/accept-response.dto"
import { ResponseStatus } from "@share/response-status.enum"
import { RequestStatus } from "@share/request-status.enum"
import { DealStatus } from "@share/deal-status.enum"

import { ChatService } from "../chat/chat.service"
import { ChatGateway } from "../chat/chat.gateway"
import { NotificationService } from "../notification/notification.service"

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly dataSource: DataSource,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async create(user: User, dto: CreateResponseDto): Promise<Response> {
    return this.respondToRequest(user, dto.requestId, { message: dto.message })
  }

  async respondToRequest(user: User, requestId: string, dto: { message?: string }): Promise<any> {
    // 1. Check if Request exists and status is published
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("REQUEST_NOT_FOUND")
    }

    if (request.status !== RequestStatus.Published) {
      throw new BadRequestException("INVALID_STATUS")
    }

    // 2. Check if performer is not the customer
    if (request.customer.id === user.id) {
      throw new ForbiddenException("ACCESS_DENIED")
    }

    // 3. Check if no active response from this performer
    const existingResponse = await this.responseRepository.findOne({
      where: { request: { id: requestId }, performer: { id: user.id } },
    })

    if (existingResponse) {
      throw new ConflictException("RESPONSE_ALREADY_EXISTS")
    }

    // 4. Create Response
    const response = this.responseRepository.create({
      request,
      performer: user,
      message: dto.message,
      status: ResponseStatus.Pending,
    })

    const savedResponse = await this.responseRepository.save(response)

    // 5. Ensure Chat exists
    const chat = await this.chatService.getOrCreateChat(request.customer.id, user.id)

    // 6. Send notification message to chat about new offer
    await this.chatService.sendMessage(user, chat.id, {
      text: "New offer on your request",
      type: "notification",
      variant: "newOffer",
    })

    return {
      id: savedResponse.id,
      requestId: savedResponse.request.id,
      performer: {
        id: savedResponse.performer.id,
        username: savedResponse.performer.username,
        firstName: savedResponse.performer.firstName,
        lastName: savedResponse.performer.lastName,
        avatar: savedResponse.performer.avatar,
      },
      status: savedResponse.status,
      message: savedResponse.message,
      createdAt: savedResponse.createdAt,
      chatId: chat.id,
    }
  }

  async findAll(requestId?: string): Promise<Response[]> {
    const queryBuilder = this.responseRepository
      .createQueryBuilder("response")
      .leftJoinAndSelect("response.performer", "performer")
      .leftJoinAndSelect("response.request", "request")
      .orderBy("response.createdAt", "DESC")

    if (requestId) {
      queryBuilder.where("request.id = :requestId", { requestId })
    }

    return queryBuilder.getMany()
  }

  async findOne(id: string): Promise<Response> {
    const response = await this.responseRepository.findOne({
      where: { id },
      relations: ["performer", "request", "request.customer"],
    })

    if (!response) {
      throw new NotFoundException("Response not found")
    }

    return response
  }

  async findByUserId(userId: string): Promise<Response[]> {
    return this.responseRepository.find({
      where: { performer: { id: userId } },
      relations: ["performer", "request", "request.customer"],
      order: { createdAt: "DESC" },
    })
  }

  async acceptResponse(user: User, responseId: string, dto: AcceptResponseDto) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Get Response and check status is pending
      const response = await manager.findOne(Response, {
        where: { id: responseId },
        relations: ["request", "request.customer", "performer"],
      })

      if (!response) {
        throw new NotFoundException("Response not found")
      }

      if (response.status !== ResponseStatus.Pending) {
        throw new BadRequestException("Response is not pending")
      }

      // 2. Check Request status is published
      if (response.request.status !== RequestStatus.Published) {
        throw new BadRequestException("Request is not published")
      }

      // 3. Check user is the customer
      if (response.request.customer.id !== user.id) {
        throw new ForbiddenException("Only the customer can accept responses")
      }

      // 4. Check if a deal already exists for this response
      const existingDeal = await manager.findOne(Deal, {
        where: { response: { id: responseId } },
      })

      if (existingDeal) {
        throw new BadRequestException("A deal already exists for this response")
      }

      // 5. Get or create chat
      const chat = await this.chatService.getOrCreateChat(response.request.customer.id, response.performer.id)

      // 5. Create Deal
      const deal = manager.create(Deal, {
        request: response.request,
        response,
        customer: response.request.customer,
        performer: response.performer,
        chat,
        status: DealStatus.Accepted,
        escrowStatus: "locked",
      })
      const savedDeal = await manager.save(Deal, deal)

      // Update chat to mark as active order
      chat.isActiveOrder = true
      await this.chatService.updateChat(chat)

      // 6. Update Request
      response.request.status = RequestStatus.Accepted
      response.request.acceptedAt = new Date()
      await manager.save(Request, response.request)

      // 7. Update Response
      response.status = ResponseStatus.Accepted
      await manager.save(Response, response)

      // 8. Notify about proposal status change via WebSocket
      this.chatGateway.notifyProposalStatusChanged(response.performer.id, response.id, ResponseStatus.Accepted)

      // 8.1. Notify about order status change via WebSocket
      this.chatGateway.notifyOrderStatusChanged(response.request.customer.id, response.request.id, RequestStatus.Accepted)
      this.chatGateway.notifyOrderStatusChanged(response.performer.id, response.request.id, RequestStatus.Accepted)

      // 9. Update all other responses for this request to rejected
      await manager
        .createQueryBuilder()
        .update(Response)
        .set({ status: ResponseStatus.Rejected })
        .where("requestId = :requestId AND id != :responseId", {
          requestId: response.request.id,
          responseId,
        })
        .execute()

      // 10. Send system message about acceptance
      await this.chatService.sendMessage(user, chat.id, { text: "Response accepted", type: "notification" })

      // 11. If message provided, send it
      if (dto.message) {
        await this.chatService.sendMessage(user, chat.id, { text: dto.message })
      }

      // 12. Send notification via queue
      await this.notificationService.send(String(response.performer.id), "response_accepted", {
        dealId: savedDeal.id,
        requestId: savedDeal.request.id,
        text: `Your response to request "${response.request.title || "Request"}" has been accepted!`,
      })

      return {
        deal: {
          id: savedDeal.id,
          requestId: savedDeal.request.id,
          responseId: savedDeal.response.id,
          status: savedDeal.status,
          escrowStatus: savedDeal.escrowStatus,
          createdAt: savedDeal.createdAt,
          chat: {
            id: savedDeal.chat.id,
          },
        },
        request: {
          id: response.request.id,
          status: response.request.status,
          acceptedAt: response.request.acceptedAt,
        },
      }
    })
  }
}