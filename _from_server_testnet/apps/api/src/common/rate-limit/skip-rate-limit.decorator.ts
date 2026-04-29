import { SkipThrottle } from "@nestjs/throttler"

export const SkipRateLimit = () => SkipThrottle()
