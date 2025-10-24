import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"
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
import { Action, ErrorCode } from "@share"
import { APIException } from "@server/api"
import UserExceptions from "./user.exceptions"

@ApiExtraModels(User)
@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    @InjectRepository(User) protected repository: Repository<User>,
    protected service: UserService,
    protected abilityFactory: AbilityFactory
  ) {}

  @UseGuards(AuthGuard)
  @Post("create")
  async create(@Body() dto: any, @GetUser() user: User) {
    const ability = await this.abilityFactory.create(user)
    if (ability.cannot(Action.Create, User)) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    // :todo create dto and call service.create method
    try {
    } catch (e) {
      if (e instanceof UserExceptions.AlreadyCreated) {
        throw new APIException(ErrorCode.BUSINESS_ERROR, `User with id(${dto.tgId}) already created`)
      }
      throw e
    }
  }

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
    return this.service.retrieve(user.id)
  }
}
