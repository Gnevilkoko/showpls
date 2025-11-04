import { Controller, Get, Inject, Post, Query, UseGuards } from "@nestjs/common"
import { getJettonServiceToken } from "./jetton/get-jetton-service-token"
import { Action, ErrorCode, Token } from "@share"
import { JettonService } from "./jetton/jetton.service"
import { RouteCache } from "../../../common/cache"
import ms from "ms"
import { GetJettonWalletDto } from "./dto/get-jetton-wallet.dto"
import { AuthGuard } from "../../auth/guards"
import { GetUser } from "../../user/decorators"
import { StarsTopUp, TONTopUp, User } from "@share/entities"
import { TONTopUpService } from "./ton-top-up.service"
import { APIException } from "@server/api"
import { AbilityFactory } from "../../auth"
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from "@nestjs/swagger"
import { SwaggerUtilities } from "../../../common/swagger.utilities"
import { IdDto } from "../../../common/dto"
import { TONTopUpListDto } from "./dto/ton-top-up-list.dto"
import { StarsTopUpListDto } from "../dto/stars-top-up.list.dto"
import { plainToInstance } from "class-transformer"

@ApiExtraModels(TONTopUp)
@ApiTags("TONTopUp")
@Controller("ton-top-up")
export class TONTopUpController {
  constructor(
    protected service: TONTopUpService,
    @Inject(getJettonServiceToken(Token.USDT)) protected jettonService: JettonService,
    protected abilityFactory: AbilityFactory
  ) {}

  @ApiOkResponse({
    schema: { $ref: getSchemaPath(TONTopUp) },
  })
  @UseGuards(AuthGuard)
  @Post("create")
  async create(@GetUser() user: User) {
    const ability = await this.abilityFactory.create(user)
    if (ability.cannot(Action.Create, TONTopUp)) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return await this.service.create({ userId: user.id })
  }

  @ApiOkResponse({
    schema: { $ref: getSchemaPath(TONTopUp) },
  })
  @UseGuards(AuthGuard)
  @Get("retrieve")
  async retrieve(@Query() { id }: IdDto, @GetUser() user: User) {
    const ability = await this.abilityFactory.create(user)
    const topUp = await this.service.retrieve(id)
    if (ability.cannot(Action.Read, topUp)) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return topUp
  }

  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(TONTopUp),
  })
  @Get("list")
  async list(@GetUser() user: User | null, @Query() dto: TONTopUpListDto) {
    const ability = await this.abilityFactory.create(user)
    if (ability.cannot(Action.Read, plainToInstance(TONTopUp, { userId: dto.filter.userId }))) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return await this.service.list(dto)
  }

  @Get("get-address-for-accept-payments")
  async getAddressForAcceptPayments() {
    return {
      address: process.env.TON_ADDRESS_FOR_ACCEPT_PAYMENTS,
    }
  }

  @RouteCache({
    ttl: ms("30m"),
  })
  @Get(`get-jetton-wallet`)
  async getJettonWallet(@Query() { holder }: GetJettonWalletDto) {
    return {
      jettonWallet: await this.jettonService.getJettonWallet(holder),
    }
  }
}
