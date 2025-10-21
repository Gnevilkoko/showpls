import { CACHE_KEY_METADATA, CACHE_MANAGER, CacheInterceptor as CI } from "@nestjs/cache-manager"
import { ExecutionContext, Inject } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Cache } from "cache-manager"
import { ConfigService } from "../../config"

export class RouteCacheInterceptor extends CI {
  constructor(
    @Inject(CACHE_MANAGER) protected cacheManager: Cache,
    protected reflector: Reflector,
  ) {
    super(cacheManager, reflector)
  }

  protected isRequestCacheable(context: ExecutionContext): boolean {
    if (!ConfigService.isProduction()) {
      return false
    }

    const noCache = this.reflector.get<boolean>(`no-cache`, context.getHandler()) || false
    if (noCache) {
      return false
    }

    return super.isRequestCacheable(context)
  }

  protected trackBy(context: ExecutionContext): string | undefined {
    if (!this.isRequestCacheable(context)) {
      return undefined
    }

    const cacheKeyMetadata = this.reflector.get(
      CACHE_KEY_METADATA, // set by @CacheKey
      context.getHandler(),
    )
    if (cacheKeyMetadata) {
      return cacheKeyMetadata
    }

    return this.getCacheKey(context)
  }

  protected getCacheKey(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest()
    return req.url as string // /api/something/list?page=1&limit=30
  }
}
