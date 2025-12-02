import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiExtraModels, ApiOkResponse, ApiOperation, ApiSecurity, ApiTags, getSchemaPath } from "@nestjs/swagger"
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
import { GeoService } from "../geo/geo.service"
import { ListPerformersDto } from "./dto/list-performers.dto"
import { UpdateLocationDto } from "./dto/update-location.dto"
import { RateLimit, IpRateLimit } from "../../common/rate-limit"

@ApiExtraModels(User)
@ApiTags("User")
@Controller("user")
export class UserController {
  constructor(
    @InjectRepository(User) protected repository: Repository<User>,
    protected service: UserService,
    protected abilityFactory: AbilityFactory,
    protected geoService: GeoService
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
  @ApiOperation({ summary: "Get performers nearby a location" })
  @ApiOkResponse({
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          username: { type: "string", nullable: true },
          firstName: { type: "string" },
          lastName: { type: "string", nullable: true },
          avatar: { type: "string", nullable: true },
          distance: { type: "number" },
          lng: { type: "number" },
          lat: { type: "number" },
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 60 }) // 60 requests per minute per IP
  @Get("list-performers")
  async listPerformers(@Query() dto: ListPerformersDto) {
    return await this.geoService.getPerformersNearby(dto.latitude, dto.longitude, dto.radiusKm)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Update user's current location" })
  @ApiOkResponse({
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
      },
    },
  })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: 60, limit: 10 }) // 10 requests per minute per IP
  @RateLimit({ ttl: 60, limit: 5 }) // 5 requests per minute per account
  @Post("update-location")
  async updateLocation(@GetUser() user: User, @Body() dto: UpdateLocationDto) {
    await this.geoService.updateUserLocation(user.id, dto.latitude, dto.longitude)
    return { success: true }
  }
}
