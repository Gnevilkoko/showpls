import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { User } from "@share/entities"
import { plainToInstance } from "class-transformer"
import { Request } from "express"

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>()
  if (!request.payload) {
    return null
  }
  return plainToInstance(User, request.payload)
})
