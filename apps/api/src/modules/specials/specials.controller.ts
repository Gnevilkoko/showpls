import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common"
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger"
import { SpecialsService } from "./specials.service"
import { AuthGuard } from "../auth/guards/auth.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { ListSpecialsDto } from "./dto/list-specials.dto"

@ApiTags("Specials")
@ApiSecurity("jwt-auth")
@UseGuards(AuthGuard)
@Controller("specials")
export class SpecialsController {
  constructor(private readonly specialsService: SpecialsService) {}

  @Get()
  @ApiOperation({ summary: "Get specials list with claim status" })
  list(@GetUser() user: User, @Query() query: ListSpecialsDto) {
    return this.specialsService.list(user, query)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get special details" })
  findOne(@GetUser() user: User, @Param("id") id: string) {
    return this.specialsService.findOne(user, id)
  }
}
