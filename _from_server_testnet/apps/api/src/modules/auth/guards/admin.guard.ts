import { ExecutionContext } from "@nestjs/common"
import { AuthGuard } from "./auth.guard"
import { ErrorCode, Role } from "@share"
import { Request } from "express"
import { APIException } from "@server/api"

export class AdminGuard extends AuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context)
    const req = context.switchToHttp().getRequest<Request>()
    const role = req.payload?.role as Role
    if (role !== Role.Admin) {
      throw new APIException(ErrorCode.ACCESS_DENIED, "You are not admin")
    }
    return true
  }
}
