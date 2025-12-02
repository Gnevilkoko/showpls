import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiSecurity } from "@nestjs/swagger"
import { ResponseService } from "./response.service"
import { CreateResponseDto } from "./dto/create-response.dto"
import { AcceptResponseDto } from "./dto/accept-response.dto"
import { AuthGuard } from "../auth/guards/auth.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { RateLimit, IpRateLimit } from "../../common/rate-limit"

@ApiTags("Responses")
@Controller("responses")
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}


  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({ summary: "Get all responses, optionally filtered by requestId" })
  @ApiQuery({ name: "requestId", required: false, description: "Filter responses by request ID" })
  async findAll(@GetUser() user: User, @Query("requestId") requestId?: string) {
    return this.responseService.findAll(requestId)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id")
  @ApiOperation({ summary: "Get a specific response by ID" })
  async findOne(@GetUser() user: User, @Param("id") id: string) {
    return this.responseService.findOne(id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 10 }) // 10 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per account
  @Post(":id/accept")
  @ApiOperation({ summary: "Accept a response and create a deal" })
  async accept(@GetUser() user: User, @Param("id") id: string, @Body() dto: AcceptResponseDto) {
    return this.responseService.acceptResponse(user, id, dto)
  }
}