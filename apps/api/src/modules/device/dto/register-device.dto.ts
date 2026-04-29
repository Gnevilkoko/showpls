import { z } from "zod"
import { DevicePlatform } from "@share/entities/device-token.entity"

export const RegisterDeviceSchema = z.object({
  pushToken: z.string().min(1).max(512),
  platform: z.nativeEnum(DevicePlatform),
  deviceId: z.string().max(255).optional(),
})

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>

export const UnregisterDeviceSchema = z.object({
  deviceId: z.string().min(1).max(255),
})

export type UnregisterDeviceDto = z.infer<typeof UnregisterDeviceSchema>
