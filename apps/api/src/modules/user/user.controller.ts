import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common"
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, getSchemaPath } from "@nestjs/swagger"
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
import { SetLanguageCodeDto } from "./dto/set-language-code.dto"
import { GetBalancesDto } from "./dto/get-balances.dto"
import { plainToInstance } from "class-transformer"
import { ResponseService } from "../response/response.service"
import { DealService } from "../deal/deal.service"

@ApiExtraModels(User)
@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    @InjectRepository(User) protected repository: Repository<User>,
    protected service: UserService,
    protected abilityFactory: AbilityFactory,
    protected responseService: ResponseService,
    protected dealService: DealService
  ) {}

  @ApiOkResponse({
    schema: { $ref: getSchemaPath(User) },
  })
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
    schema: { $ref: getSchemaPath(User) },
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

  @UseGuards(AuthGuard)
  @Post("set-language-code")
  async setLanguageCode(@GetUser() user: User, @Body() { code }: SetLanguageCodeDto) {
    await this.service.setLanguageCode(user.id, code)
  }

  @ApiSecurity("jwt-auth")
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          name: { type: "string" },
          blockchain: { type: "string", nullable: true },
          balance: { type: "string" },
          lockedBalance: { type: "string" },
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @Get("get-balances")
  async getBalances(@GetUser() user: User, @Query() { id }: GetBalancesDto) {
    const ability = await this.abilityFactory.create(user)
    if (ability.cannot(Action.Read, plainToInstance(User, { id }))) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return await this.service.getBalances(id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id/responses")
  @ApiOperation({ summary: "Get all responses from a specific user" })
  async getUserResponses(@Param("id") id: string) {
    try {
      // Check if user exists
      await this.service.retrieve(id)
    } catch {
      throw new NotFoundException("User not found")
    }
    return this.responseService.findByUserId(id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get(":id/deals")
  @ApiOperation({ summary: "Get all deals from a specific user" })
  async getUserDeals(@Param("id") id: string) {
    try {
      // Check if user exists
      await this.service.retrieve(id)
    } catch {
      throw new NotFoundException("User not found")
    }
    return this.dealService.findByUserId(id)
  }
}
