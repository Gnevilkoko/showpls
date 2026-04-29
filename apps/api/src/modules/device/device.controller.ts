import { Body, Controller, Delete, Post, UseGuards } from "@nestjs/common"
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger"
import { User } from "@share/entities"
import { AuthGuard } from "../auth/guards"
import { GetUser } from "../user/decorators"
import { DeviceService } from "./device.service"
import { RegisterDeviceDto, RegisterDeviceSchema, UnregisterDeviceDto, UnregisterDeviceSchema } from "./dto/register-device.dto"
import { ValidationPipe } from "../../common/validation"
import { RateLimit, IpRateLimit } from "../../common/rate-limit"
import ms from "ms"

@ApiTags("Device")
@Controller("device")
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @ApiSecurity("jwt-auth")
  @ApiOperation({
    summary: "Сохранить push-token устройства (FCM / APNs)",
    description:
      "POST .../api/device/push-token с заголовком Authorization: Bearer и access-токеном сессии. " +
      "Тело: { pushToken, platform: \"ios\"|\"android\"|\"web\", deviceId? }. " +
      "См. также @showpls/source MobileApiRoutes в пакете share.",
  })
  @UseGuards(AuthGuard)
  @RateLimit({ ttl: ms("1m"), limit: 10 })
  @IpRateLimit({ ttl: ms("1m"), limit: 30 })
  @Post("push-token")
  async registerPushToken(
    @GetUser() user: User,
    @Body(new ValidationPipe(RegisterDeviceSchema)) dto: RegisterDeviceDto,
  ) {
    const token = await this.deviceService.registerToken(user.id, dto)
    return {
      id: token.id,
      platform: token.platform,
      deviceId: token.deviceId,
      isActive: token.isActive,
    }
  }

  @ApiSecurity("jwt-auth")
  @ApiOperation({ summary: "Unregister device push token" })
  @UseGuards(AuthGuard)
  @RateLimit({ ttl: ms("1m"), limit: 10 })
  @Delete("push-token")
  async unregisterPushToken(
    @GetUser() user: User,
    @Body(new ValidationPipe(UnregisterDeviceSchema)) dto: UnregisterDeviceDto,
  ) {
    await this.deviceService.unregisterToken(user.id, dto.deviceId)
    return { success: true }
  }
}
