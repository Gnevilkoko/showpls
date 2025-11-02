import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"
import { RateLimit } from "../../../common/rate-limit"
import ms from "ms"
import { AuthGuard } from "../../auth/guards"
import { StarsTopUpService } from "./stars-top-up.service"
import { AbilityFactory } from "../../auth"
import { GetUser } from "../../user/decorators"
import { StarsTopUp, User } from "@share/entities"
import { Action, ErrorCode } from "@share"
import { APIException } from "@server/api"
import { CreateStarsTopUpDto } from "../dto/create-stars-top-up.dto"
import { plainToInstance } from "class-transformer"
import { StarsTopUpListDto } from "../dto/stars-top-up.list.dto"
import { ApiExtraModels, ApiOkResponse, ApiTags } from "@nestjs/swagger"
import { SwaggerUtilities } from "../../../common/swagger.utilities"
import { IdDto } from "../../../common/dto"

@ApiExtraModels(StarsTopUp)
@ApiTags("StarsTopUp")
@Controller("stars-top-up")
export class StarsTopUpController {
  constructor(protected service: StarsTopUpService, protected abilityFactory: AbilityFactory) {}

  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(StarsTopUp),
  })
  @RateLimit({
    limit: 1,
    ttl: ms("30s"),
  })
  @UseGuards(AuthGuard)
  @Post("create")
  async create(@Body() dto: CreateStarsTopUpDto, @GetUser() user: User) {
    const ability = await this.abilityFactory.create(user)
    if (ability.cannot(Action.Create, StarsTopUp)) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return await this.service.create({
      amount: dto.amount,
      userId: user.id,
    })
  }

  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(StarsTopUp),
  })
  @Get("retrieve")
  async retrieve(@Query() { id }: IdDto) {
    return await this.service.retrieve(id)
  }

  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(StarsTopUp),
  })
  @Get("list")
  async list(@GetUser() user: User | null, @Query() dto: StarsTopUpListDto) {
    const ability = await this.abilityFactory.create(user)
    if (ability.cannot(Action.Read, plainToInstance(StarsTopUp, { userId: dto.filter.userId }))) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return await this.service.list(dto)
  }
}
