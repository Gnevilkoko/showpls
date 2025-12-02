import { applyDecorators, UseGuards } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import { IpRateLimitGuard } from "./ip-rate-limit.guard"

export const IpRateLimit = (options: { ttl: number; limit: number }) => {
  return applyDecorators(
    UseGuards(IpRateLimitGuard),
    Throttle({
      default: {
        ...options,
      },
    })
  )
}