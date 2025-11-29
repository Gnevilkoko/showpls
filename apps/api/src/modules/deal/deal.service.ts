import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { DataSource, Repository } from "typeorm"
import { Deal, Request, Response, User } from "@share/entities"
import { CreateDealDto } from "./dto/create-deal.dto"
import { DealStatus } from "@share/deal-status.enum"
import { RequestStatus } from "@share/request-status.enum"
import { EscrowHoldService } from "@ledger/escrow/escrow-hold.service"
import { Ledger } from "@ledger"

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    @InjectRepository(Request)
    private readonly requestRepository: Repository<Request>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    private readonly escrowHoldService: EscrowHoldService,
    private readonly dataSource: DataSource,
    private readonly ledger: Ledger
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

    // 2. Check if Request status is OPEN
    if (request.status !== RequestStatus.Open) {
      throw new BadRequestException("Request is not open")
    }

    // 3. Check if User is the Customer (only customer can accept a response)
    if (request.customer.id !== user.id) {
      throw new ForbiddenException("Only the customer can create a deal")
    }

    // 4. Check if Response exists and belongs to this Request
    const response = await this.responseRepository.findOne({
      where: { id: dto.responseId, requestId: request.id },
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

    // 6. Create Deal and Hold Funds in a transaction
    return this.dataSource.transaction(async (manager) => {
      // Create Deal
      const deal = this.dealRepository.create({
        request,
        response,
        status: DealStatus.Created,
      })
      const savedDeal = await manager.save(Deal, deal)

      // Hold Funds (Ledger Integration) with proper error handling
      try {
        // Retrieve currency by code to get its ID
        const currency = await this.ledger.currency.retrieve({
          code: request.currencyId,
          blockchain: null, // Assuming fiat currencies like RUB have null blockchain
        })
        
        if (!currency) {
          throw new BadRequestException(`Currency ${request.currencyId} not found`)
        }

        // Convert price to smallest unit (e.g., rubles to kopecks)
        const priceInKopecks = BigInt(Math.round(parseFloat(request.price) * 100))
        
        await this.escrowHoldService.hold(
          {
            externalType: "deal",
            externalId: savedDeal.id,
            from: request.customer.id,
            to: response.performer.id,
            currencyId: currency.id,
            amount: priceInKopecks,
          },
          manager
        )
      } catch (error) {
        // Handle ledger-specific errors gracefully
        const errorMessage = error instanceof Error ? error.message : String(error)
        if (errorMessage.toLowerCase().includes("insufficient funds")) {
          throw new BadRequestException("Insufficient funds")
        }
        // Re-throw other errors as BadRequestException with descriptive message
        throw new BadRequestException(errorMessage || "Failed to hold funds in escrow")
      }

      // Update Request Status to Active
      request.status = RequestStatus.Active
      await manager.save(Request, request)

      return savedDeal
    })
  }

  async findAll(): Promise<Deal[]> {
    return this.dealRepository.find({
      relations: ["request", "response", "request.customer", "response.performer"],
      order: { createdAt: "DESC" },
    })
  }

  async findOne(id: string): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id },
      relations: ["request", "response", "request.customer", "response.performer"],
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
      relations: ["request", "response", "request.customer", "response.performer"],
      order: { createdAt: "DESC" },
    })
  }
}