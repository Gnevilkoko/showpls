import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger"
import { DealService } from "./deal.service"
import { CreateDealDto } from "./dto/create-deal.dto"
import { ListDealsDto } from "./dto/list-deals.dto"
import { AuthGuard } from "../auth/guards/auth.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"

@ApiTags("Deals")
@Controller("deal")
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get('list')
  @ApiOperation({ summary: "List user's deals" })
  list(@GetUser() user: User, @Query() query: ListDealsDto) {
    return this.dealService.findAllForUser(user, query)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get()
  findAll(@GetUser() user: User) {
    return this.dealService.findAll()
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id")
  findOne(@GetUser() user: User, @Param("id") id: string) {
    return this.dealService.findOne(id)
  }
}