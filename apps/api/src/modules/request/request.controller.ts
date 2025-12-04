import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, ApiQuery } from "@nestjs/swagger"
import { RequestService } from "./request.service"
import { CreateRequestDto } from "./dto/create-request.dto"
import { CreateDirectRequestDto } from "./dto/create-direct-request.dto"
import { ListRequestsDto } from "./dto/list-requests.dto"
import { UpdateRequestDto } from "./dto/update-request.dto"
import { RespondToRequestDto } from "./dto/respond-to-request.dto"
import { CompleteRequestDto } from "./dto/complete-request.dto"
import { AuthGuard } from "../auth/guards/auth.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { RateLimit, IpRateLimit } from "../../common/rate-limit"
import { RouteCache } from "../../common/cache/route-cache.decorator"
import { ResponseService } from "../response/response.service"
import { GeoService } from "../geo/geo.service"
import { GetRequestMapDto } from "./dto/get-request-map.dto"
import { GetNearbyPerformersDto } from "./dto/get-nearby-performers.dto"

@ApiTags("Requests")
@Controller("request")
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService,
    private readonly geoService: GeoService,
  ) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 3 }) // 3 requests per minute per account
  @Post('create')
  @ApiOperation({ summary: "Create a new request" })
  async create(@GetUser() user: User, @Body() dto: CreateRequestDto) {
    return this.requestService.create(user, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 3 }) // 3 requests per minute per account
  @Post('create-direct')
  @ApiOperation({ summary: "Create a request with direct offer to a specific performer" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        status: { type: "string", example: "published" },
        attachments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              url: { type: "string" },
              hash: { type: "string" },
            },
          },
        },
        latitude: { type: "number" },
        longitude: { type: "number" },
        customer: {
          type: "object",
          properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string", nullable: true },
            avatar: { type: "string", nullable: true },
          },
        },
        performer: { type: "null" },
        createdAt: { type: "string" },
        acceptedAt: { type: "null" },
        expiresAt: { type: "string", nullable: true },
        deadlineAt: { type: "string", nullable: true },
        isUrgent: { type: "boolean" },
        metadata: { type: "object" },
        chatId: { type: "string", description: "ID of created/existing chat" },
        responseId: { type: "string", description: "ID of created Response (offer)" },
      },
    },
  })
  async createDirect(@GetUser() user: User, @Body() dto: CreateDirectRequestDto) {
    return this.requestService.createDirect(user, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 60 }) // 60 requests per minute per IP
  @RouteCache({ ttl: 300 }) // 5 minutes TTL
  @Get('list')
  @ApiOperation({ summary: "Get requests with filtering and pagination" })
  findAll(@GetUser() user: User, @Query() query: ListRequestsDto) {
    return this.requestService.findAll(user, query)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Get requests within map bounds" })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          price: { type: "number" },
          status: { type: "string" },
          lng: { type: "number" },
          lat: { type: "number" },
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 60 }) // 60 requests per minute per IP
  @RouteCache({ ttl: 300 }) // 5 minutes TTL
  @Get("map")
  async getRequestMap(@Query() dto: GetRequestMapDto) {
    return await this.geoService.getRequestsInBounds(dto.north, dto.south, dto.east, dto.west)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific request by ID" })
  findOne(@Param("id") id: string) {
    return this.requestService.findOne(id, undefined)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Put(":id")
  @ApiOperation({ summary: "Update a draft request" })
  update(@GetUser() user: User, @Param("id") id: string, @Body() dto: UpdateRequestDto) {
    return this.requestService.update(user, id, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id/responses")
  @ApiOperation({ summary: "Get all responses for a specific request" })
  findRequestResponses(@GetUser() user: User, @Param("id") id: string) {
    return this.requestService.findRequestResponses(id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 10 }) // 10 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per account
  @Post(":id/respond")
  @ApiOperation({ summary: "Respond to a request" })
  async respond(@GetUser() user: User, @Param("id") id: string, @Body() dto: RespondToRequestDto) {
    return this.responseService.respondToRequest(user, id, dto)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Get performers nearby a specific request" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string", nullable: true },
              avatar: { type: "string", nullable: true },
              rating: { type: "number" },
              latitude: { type: "number" },
              longitude: { type: "number" },
              distance: { type: "number" },
            },
          },
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 60 }) // 60 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 60 }) // 60 requests per minute per account
  @RouteCache({ ttl: 120 }) // 2 minutes TTL
  @Get(":id/nearby-performers")
  async getNearbyPerformers(@Param("id") id: string, @Query() dto: GetNearbyPerformersDto) {
    return this.geoService.getPerformersNearbyRequest(id, dto.radius, dto.limit)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOperation({ summary: "Delete a draft request" })
  delete(@GetUser() user: User, @Param("id") id: string) {
    return this.requestService.delete(user, id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel a request" })
  async cancel(@GetUser() user: User, @Param("id") id: string) {
    return this.requestService.cancel(user, id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 3 }) // 3 requests per minute per account
  @Post(":id/complete")
  @ApiOperation({ summary: "Complete a task (customer only)" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        id: { type: "string" },
        status: { type: "string", example: "completed" },
        completedAt: { type: "string", format: "date-time" },
        deal: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: { type: "string", example: "completed" },
            escrowStatus: { type: "string", example: "released" },
          },
        },
      },
    },
  })
  async complete(@GetUser() user: User, @Param("id") id: string, @Body() dto: CompleteRequestDto) {
    return this.requestService.complete(user, id, dto)
  }
}
