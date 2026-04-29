import { Body, Controller, Get, Patch, Post, Query, UseGuards } from "@nestjs/common"
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
import { UpdateProfileDto } from "./dto/update-profile.dto"
import { UserTransactionsDto } from "./dto/user-transactions.dto"
import { plainToInstance } from "class-transformer"
import { GeoService } from "../geo/geo.service"
import { ListPerformersDto } from "./dto/list-performers.dto"
import { ListPerformersMapDto } from "./dto/list-performers-map.dto"
import { UpdateLocationDto } from "./dto/update-location.dto"
import { SubmitPerformerVerificationDto } from "./dto/submit-performer-verification.dto"
import { PatchPerformerVerificationGeoDto } from "./dto/patch-performer-verification-geo.dto"
import { RateLimit, IpRateLimit } from "../../common/rate-limit"
import ms from "ms"

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
    return await this.service.retrieveProfile(id)
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
    return this.service.retrieveProfile(user.id)
  }

  @ApiSecurity("jwt-auth")
  @UseGuards(AuthGuard)
  @Get("reviews")
  async getReviews(@GetUser() user: User, @Query("id") id?: string) {
    return this.service.getReviews(id || user.id)
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
  @IpRateLimit({ ttl: ms("1m"), limit: 60 }) // 60 requests per minute per IP
  @Get("list-performers")
  async listPerformers(@Query() dto: ListPerformersDto) {
    return await this.geoService.getPerformersNearby(dto.latitude, dto.longitude, dto.radiusKm)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "All ready-to-work performers with location (for map)" })
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
          rating: { type: "number" },
          distance: { type: "number" },
          lng: { type: "number" },
          lat: { type: "number" },
        },
      },
    },
  })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: ms("1m"), limit: 30 })
  @Get("list-performers-map")
  async listPerformersMap(@Query() dto: ListPerformersMapDto) {
    return await this.geoService.getPerformersReadyForMap(dto.limit ?? 1500)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Get user transaction history" })
  @UseGuards(AuthGuard)
  @Get("transactions")
  async getTransactions(@GetUser() user: User, @Query() query: UserTransactionsDto) {
    return this.service.getTransactions(user.id, query)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Update user profile" })
  @UseGuards(AuthGuard)
  @Patch("profile")
  async updateProfile(@GetUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(user.id, dto)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Toggle performer availability" })
  @UseGuards(AuthGuard)
  @Patch("toggle-available")
  async toggleAvailable(@GetUser() user: User) {
    return this.service.toggleAvailable(user.id)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Submit performer verification (device + geolocation)" })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: ms("1m"), limit: 10 })
  @Post("performer-verification")
  async submitPerformerVerification(@GetUser() user: User, @Body() dto: SubmitPerformerVerificationDto) {
    return this.service.submitPerformerVerification(user.id, dto)
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Update performer map coordinates (after verification)" })
  @UseGuards(AuthGuard)
  @IpRateLimit({ ttl: ms("1m"), limit: 20 })
  @Patch("performer-verification-geo")
  async patchPerformerVerificationGeo(@GetUser() user: User, @Body() dto: PatchPerformerVerificationGeoDto) {
    return this.service.updatePerformerVerificationGeo(user.id, dto)
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
  @IpRateLimit({ ttl: ms("1m"), limit: 60 }) // per IP (фон + включение «готов»)
  @RateLimit({ ttl: ms("1m"), limit: 90 }) // per аккаунт
  @Post("update-location")
  async updateLocation(@GetUser() user: User, @Body() dto: UpdateLocationDto) {
    await this.geoService.updateUserLocation(user.id, dto.latitude, dto.longitude)
    return { success: true }
  }
}
