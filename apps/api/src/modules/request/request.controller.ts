import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { RequestService } from "./request.service"
import { CreateRequestDto } from "./dto/create-request.dto"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { AuthGuard } from "../auth/guards/auth.guard"

@ApiTags("Requests")
@Controller("requests")
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Post()
  @ApiOperation({ summary: "Create a new request" })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  async create(@GetUser() user: User, @Body() dto: CreateRequestDto) {
    return this.requestService.create(user, dto)
  }

  @Get()
  @ApiOperation({ summary: "Get all requests" })
  findAll() {
    return this.requestService.findAll()
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific request by ID" })
  findOne(@Param("id") id: string) {
    return this.requestService.findOne(id)
  }

  @Get(":id/responses")
  @ApiOperation({ summary: "Get all responses for a specific request" })
  findRequestResponses(@Param("id") id: string) {
    return this.requestService.findRequestResponses(id)
  }
}
