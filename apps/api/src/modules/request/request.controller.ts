import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags, ApiQuery } from "@nestjs/swagger"
import { RequestService } from "./request.service"
import { CreateRequestDto } from "./dto/create-request.dto"
import { ListRequestsDto } from "./dto/list-requests.dto"
import { UpdateRequestDto } from "./dto/update-request.dto"
import { RespondToRequestDto } from "./dto/respond-to-request.dto"
import { AuthGuard } from "../auth/guards/auth.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { RateLimit } from "../../common/rate-limit/rate-limit.decorator"
import { RouteCache } from "../../common/cache/route-cache.decorator"
import { ResponseService } from "../response/response.service"

@ApiTags("Requests")
@Controller("request")
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly responseService: ResponseService,
  ) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @RateLimit({ ttl: 60, limit: 3 }) // 3 requests per minute per account
  @Post('create')
  @ApiOperation({ summary: "Create a new request" })
  async create(@GetUser() user: User, @Body() dto: CreateRequestDto) {
    return this.requestService.create(user, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @RouteCache({ ttl: 300 }) // 5 minutes TTL
  @Get('list')
  @ApiOperation({ summary: "Get requests with filtering and pagination" })
  findAll(@GetUser() user: User, @Query() query: ListRequestsDto) {
    return this.requestService.findAll(user, query)
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
  @RateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per account
  @Post(":id/respond")
  @ApiOperation({ summary: "Respond to a request" })
  async respond(@GetUser() user: User, @Param("id") id: string, @Body() dto: RespondToRequestDto) {
    return this.responseService.respondToRequest(user, id, dto)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Delete(":id")
  @ApiOperation({ summary: "Delete a draft request" })
  delete(@GetUser() user: User, @Param("id") id: string) {
    return this.requestService.delete(user, id)
  }
}
