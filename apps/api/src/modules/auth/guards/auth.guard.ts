import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common"
import { ErrorCode } from "@share"
import { Request } from "express"
import { APIException } from "@server/api"

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    // @ts-ignore
    const payload = req.payload
    if (payload == null) {
      throw new APIException(ErrorCode.UNAUTHORIZED, "You are not authorized")
    }
    return true
  }
}
