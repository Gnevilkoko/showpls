import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { DeviceToken, DevicePlatform } from "@share/entities/device-token.entity"
import { User } from "@share/entities"

const MAX_DEVICES_PER_USER = 10

export interface RegisterDeviceParams {
  pushToken: string
  platform: DevicePlatform
  deviceId?: string
}

@Injectable()
export class DeviceService {
  private readonly logger = new Logger(DeviceService.name)

  constructor(
    @InjectRepository(DeviceToken) private readonly deviceTokenRepository: Repository<DeviceToken>,
  ) {}

  async registerToken(userId: string, params: RegisterDeviceParams): Promise<DeviceToken> {
    const { pushToken, platform, deviceId } = params
    const effectiveDeviceId = deviceId || `${platform}_${pushToken.slice(-16)}`

    const existing = await this.deviceTokenRepository.findOne({
      where: { user: { id: userId }, deviceId: effectiveDeviceId },
    })

    if (existing) {
      existing.pushToken = pushToken
      existing.platform = platform
      existing.isActive = true
      return this.deviceTokenRepository.save(existing)
    }

    const activeCount = await this.deviceTokenRepository.count({
      where: { user: { id: userId }, isActive: true },
    })

    if (activeCount >= MAX_DEVICES_PER_USER) {
      const oldest = await this.deviceTokenRepository.findOne({
        where: { user: { id: userId }, isActive: true },
        order: { updatedAt: "ASC" },
      })
      if (oldest) {
        oldest.isActive = false
        await this.deviceTokenRepository.save(oldest)
      }
    }

    const token = this.deviceTokenRepository.create({
      user: { id: userId } as User,
      pushToken,
      platform,
      deviceId: effectiveDeviceId,
      isActive: true,
    })

    return this.deviceTokenRepository.save(token)
  }

  async unregisterToken(userId: string, deviceId: string): Promise<void> {
    await this.deviceTokenRepository.update(
      { user: { id: userId }, deviceId },
      { isActive: false },
    )
  }

  async getActiveTokens(userId: string): Promise<DeviceToken[]> {
    return this.deviceTokenRepository.find({
      where: { user: { id: userId }, isActive: true },
    })
  }

  async deactivateToken(pushToken: string): Promise<void> {
    await this.deviceTokenRepository.update({ pushToken }, { isActive: false })
  }
}
