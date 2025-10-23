import { Controller, Get } from "@nestjs/common"
import { ApiExtraModels, ApiOkResponse, ApiTags } from "@nestjs/swagger"
import { ZodResponse } from "nestjs-zod"
import { User } from "@share/entities"
import { SwaggerUtilities } from "../../common/swagger.utilities"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"

@ApiExtraModels(User)
@ApiTags("User")
@Controller("user")
export class UserController {

  constructor(
    @InjectRepository(User) protected repository: Repository<User>
  ) {}
  
  @ApiOkResponse({
    schema: SwaggerUtilities.getPaginatedResponseSchema(User)
  })
  @Get("list")
  async list() {

  }
}
