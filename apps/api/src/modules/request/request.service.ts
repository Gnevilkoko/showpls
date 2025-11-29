import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Request, Response, User } from "@share/entities"
import { CreateRequestDto } from "./dto/create-request.dto"
import { RequestStatus } from "@share/request-status.enum"

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
  ) {}

  async create(user: User, dto: CreateRequestDto): Promise<Request> {
    // 1. Validate that expiresAt is in the future
    const expiresAt = new Date(dto.expiresAt)
    const now = new Date()
    
    if (expiresAt <= now) {
      throw new BadRequestException("Expiration date must be in the future")
    }

    // 2. Validate price is a positive number
    const price = parseFloat(dto.price)
    if (isNaN(price) || price <= 0) {
      throw new BadRequestException("Price must be a positive number")
    }

    // 3. Validate location coordinates
    if (dto.location.lat < -90 || dto.location.lat > 90) {
      throw new BadRequestException("Latitude must be between -90 and 90")
    }
    if (dto.location.lng < -180 || dto.location.lng > 180) {
      throw new BadRequestException("Longitude must be between -180 and 180")
    }

    // 4. Create Request object with proper PostGIS Point mapping
    const request = this.requestRepository.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      currencyId: dto.currencyId,
      expiresAt: dto.expiresAt,
      customer: user,
      status: RequestStatus.Open,
      // Map DTO location to PostGIS Point (longitude first!)
      location: {
        type: 'Point',
        coordinates: [dto.location.lng, dto.location.lat]
      },
      // Store address separately if Request entity has this field
      address: dto.location.address
    })

    // 5. Save the Request
    try {
      return await this.requestRepository.save(request)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new BadRequestException(`Failed to create request: ${errorMessage}`)
    }
  }

  async findAll(): Promise<Request[]> {
    return this.requestRepository.find({
      relations: ["customer"],
      order: { createdAt: "DESC" },
    })
  }

  async findOne(id: string): Promise<Request> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ["customer", "responses", "responses.performer"],
    })

    if (!request) {
      throw new NotFoundException("Request not found")
    }

    return request
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
      where: { requestId },
      relations: ["performer"],
      order: { createdAt: "DESC" },
    })
  }
}