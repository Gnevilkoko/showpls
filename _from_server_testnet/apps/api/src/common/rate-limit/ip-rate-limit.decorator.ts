import { applyDecorators, UseGuards } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import { IpRateLimitGuard } from "./ip-rate-limit.guard"

/** @nestjs/throttler: ttl в миллисекундах (используйте `ms("1m")`, а не `60`). */
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