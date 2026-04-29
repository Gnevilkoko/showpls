import { ExecutionContext, Injectable } from "@nestjs/common"
import { ThrottlerGuard, ThrottlerLimitDetail } from "@nestjs/throttler"
import { ErrorCode } from "@share"
import { Request } from "express"
import { getClientIp } from "request-ip"
import { ConfigService } from "../../config"
import { APIException } from "@server/api"

@Injectable()
export class IpRateLimitGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext) {
    if (!ConfigService.isProduction()) {
      return true
    }

    return await super.canActivate(context)
  }

  protected async getTracker(req: Request): Promise<string> {
    // Always use IP address for tracking
    const ip = getClientIp(req)
    return ip || "127.0.0.1"
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail
  ): Promise<void> {
    throw new APIException(ErrorCode.RATE_LIMITED, {
      wait: throttlerLimitDetail.timeToExpire * 1000,
    })
  }
}