import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common"
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger"
import { SpecialsService } from "./specials.service"
import { AuthGuard } from "../auth/guards/auth.guard"
import { AdminGuard } from "../auth/guards/admin.guard"
import { GetUser } from "../user/decorators/get-user.decorator"
import { User } from "@share/entities"
import { ListSpecialsDto } from "./dto/list-specials.dto"
import { CreateSpecialDto } from "./dto/create-special.dto"
import { UpdateSpecialDto } from "./dto/update-special.dto"

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

  @Get("manage")
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "List all specials for admin (including inactive)" })
  listForAdmin(@Query() query: ListSpecialsDto) {
    return this.specialsService.listForAdmin(query)
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "Create special (admin only)" })
  create(@Body() dto: CreateSpecialDto) {
    return this.specialsService.create(dto)
  }

  @Patch(":id")
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "Update special (admin only)" })
  update(@Param("id") id: string, @Body() dto: UpdateSpecialDto) {
    return this.specialsService.update(id, dto)
  }

  @Delete(":id")
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: "Delete special (admin only)" })
  remove(@Param("id") id: string) {
    return this.specialsService.remove(id)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get special details" })
  findOne(@GetUser() user: User, @Param("id") id: string) {
    return this.specialsService.findOne(user, id)
  }
}
