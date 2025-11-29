import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Response, Request, User } from "@share/entities"
import { CreateResponseDto } from "./dto/create-response.dto"
import { ResponseStatus } from "@share/response-status.enum"
import { RequestStatus } from "@share/request-status.enum"

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
  ) {}

  async create(user: User, dto: CreateResponseDto): Promise<Response> {
    // 1. Check if Request exists
    const request = await this.requestRepository.findOne({
      where: { id: dto.requestId },
      relations: ["customer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    // 2. Check if Request status is OPEN
    if (request.status !== RequestStatus.Open) {
      throw new BadRequestException("Request is not open")
    }

    // 3. Check if User is NOT the Customer (cannot do work for yourself)
    if (request.customer.id === user.id) {
      throw new ForbiddenException("Customer cannot respond to their own request")
    }

    // 4. Check if User has already responded (prevent duplicate spam)
    const existingResponse = await this.responseRepository.findOne({
      where: { requestId: dto.requestId, performer: { id: user.id } },
    })

    if (existingResponse) {
      throw new ConflictException("You have already responded to this request")
    }

    // 5. Save the Response with status PENDING
    const response = this.responseRepository.create({
      requestId: dto.requestId,
      request,
      performer: user,
      status: ResponseStatus.Pending,
    })

    return this.responseRepository.save(response)
  }

  async findAll(requestId?: string): Promise<Response[]> {
    const queryBuilder = this.responseRepository
      .createQueryBuilder("response")
      .leftJoinAndSelect("response.performer", "performer")
      .leftJoinAndSelect("response.request", "request")
      .orderBy("response.createdAt", "DESC")

    if (requestId) {
      queryBuilder.where("response.requestId = :requestId", { requestId })
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
}