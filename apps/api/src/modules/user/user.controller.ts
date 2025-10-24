import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { ApiExtraModels, ApiOkResponse, ApiSecurity, ApiTags, getSchemaPath } from "@nestjs/swagger"
import { User } from "@share/entities"
import { SwaggerUtilities } from "../../common/swagger.utilities"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { AdminGuard, AuthGuard } from "../auth/guards"
import { UserService } from "./user.service"
import { GetUser } from "./decorators"
import { UserListDto } from "./dto/user-list.dto"
import { IdDto } from "../../common/dto"
import { AbilityFactory } from "../auth"

@ApiExtraModels(User)
@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    @InjectRepository(User) protected repository: Repository<User>,
    protected service: UserService,
    protected abilityFactory: AbilityFactory
  ) {}

  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(User),
  })
  @Get(`retrieve`)
  async retrieve(@Query() { id }: IdDto) {
    return await this.service.retrieve(id)
  }

  @ApiSecurity("jwt-auth")
  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(User),
  })
  @UseGuards(AdminGuard)
  @Get("list")
  async list(@Query() dto: UserListDto) {
    return this.service.list(dto)
  }

  @ApiSecurity("jwt-auth")
  @ApiOkResponse({
    schema: {
      type: "object",
      $ref: getSchemaPath(User),
    },
  })
  @UseGuards(AuthGuard)
  @Get("get-me")
  async getMe(@GetUser() user: User) {
    return  this.service.retrieve(user.id)
  }

}
