import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger"
import { ResponseService } from "./response.service"
import { CreateResponseDto } from "./dto/create-response.dto"
import { User } from "@share/entities"
import { GetUser } from "../user/decorators/get-user.decorator"
import { AuthGuard } from "../auth/guards/auth.guard"

@ApiTags("Responses")
@Controller("responses")
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

@Post()
  @ApiOperation({ summary: "Create a new response..." })
  @UseGuards(AuthGuard) 
  @ApiBearerAuth() 
  async create(@GetUser() user: User, @Body() dto: CreateResponseDto) {
     return this.responseService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all responses, optionally filtered by requestId" })
  @ApiQuery({ name: "requestId", required: false, description: "Filter responses by request ID" })
  async findAll(@Query("requestId") requestId?: string) {
    return this.responseService.findAll(requestId)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific response by ID" })
  async findOne(@Param("id") id: string) {
    return this.responseService.findOne(id)
  }
}