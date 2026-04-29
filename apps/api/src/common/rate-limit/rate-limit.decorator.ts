import { applyDecorators, UseGuards } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import { RateLimitGuard } from "./rate-limit.guard"

/** @nestjs/throttler: ttl в миллисекундах (используйте `ms("1m")`, а не `60`). */
export const RateLimit = (options: { ttl: number; limit: number }) => {
  return applyDecorators(
    UseGuards(RateLimitGuard),
    Throttle({
      default: {
        ...options,
      },
    })
  )
}
