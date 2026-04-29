import { Controller, Get, Query, UseGuards } from "@nestjs/common"
import { TopUpService } from "./top-up.service"
import { AuthGuard } from "../auth/guards"
import { TopUpListDto } from "./dto/top-up-list.dto"
import { ApiExtraModels, ApiTags } from "@nestjs/swagger"
import { GetUser } from "../user/decorators"
import { User } from "@share/entities"
import { ErrorCode, Role } from "@share"
import { APIException } from "@server/api"
import { TopUp } from "./top-up"

@ApiExtraModels(TopUp)
@ApiTags("TopUp")
@Controller("top-up")
export class TopUpController {
  constructor(protected service: TopUpService) {}

  // @ApiOkResponse(SwaggerUtilities.getPaginatedResponseSchema(TopUp))
  @UseGuards(AuthGuard)
  @Get("list")
  async list(@Query() dto: TopUpListDto, @GetUser() user: User) {
    if (user.role !== Role.Admin && user.id !== dto.filter.userId) {
      throw new APIException(ErrorCode.ACCESS_DENIED)
    }
    return await this.service.list(dto)
  }
}
