import { applyDecorators, UseInterceptors } from "@nestjs/common"
import { CacheKey, CacheTTL } from "@nestjs/cache-manager"
import { RouteCacheInterceptor } from "./route-cache.interceptor"

export const RouteCache = (options: { ttl: number; key?: string }) => {
  return applyDecorators(
    UseInterceptors(RouteCacheInterceptor),
    ...(options.key ? [CacheKey(options.key)] : []),
    CacheTTL(options.ttl),
  )
}
