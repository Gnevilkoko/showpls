import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { DealService } from "./deal.service"
import { CreateDealDto } from "./dto/create-deal.dto"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { AuthGuard } from "../auth/guards/auth.guard"

@ApiTags("Deals")
@Controller("deals")
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post()
  @ApiOperation({ summary: "Create a new response..." })
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  create(@GetUser() user: User, @Body() dto: CreateDealDto) {
    return this.dealService.create(user, dto)
  }

  @Get()
  findAll() {
    return this.dealService.findAll()
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.dealService.findOne(id)
  }
}