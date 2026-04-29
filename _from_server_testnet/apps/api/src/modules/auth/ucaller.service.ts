import { Injectable } from "@nestjs/common"
import { InjectLogger } from "@server/logging"
import { Logger } from "winston"

interface UCallerInitCallResponse {
  status: boolean
  ucaller_id: number
  phone: string
  code: string
  client?: string
  unique_request_id?: string
  exists?: boolean
  error?: string
  code_error?: number
}

const MAX_VERIFY_ATTEMPTS = 5

@Injectable()
export class UCallerService {
  private readonly apiUrl = "https://api.ucaller.ru/v1.0"
  private readonly key = process.env.UCALLER_KEY || ""
  private readonly serviceId = process.env.UCALLER_SERVICE_ID || ""
  /** См. https://developer.ucaller.ru/methods/initcall/ — при переадресации на автоответчик у оператора чаще помогает mix (РФ) или voice (РФ/KZ). */
  private readonly useMix = process.env.UCALLER_MIX === "true"
  private readonly useVoice = process.env.UCALLER_VOICE === "true"
  private readonly pendingCodes = new Map<string, { code: string; ucallerId: number; expiresAt: number; attempts: number }>()

  constructor(@InjectLogger() private logger: Logger) {
    this.logger = logger.child({ context: UCallerService.name })
  }

  async initCall(phone: string): Promise<{ ucallerId: number; code: string }> {
    const normalizedPhone = phone.replace(/\D/g, "")
    const code = String(Math.floor(1000 + Math.random() * 9000))

    const payload: Record<string, unknown> = {
      phone: Number(normalizedPhone),
      code: Number(code),
    }
    if (this.useMix) {
      payload.mix = true
    } else if (this.useVoice) {
      payload.voice = true
    }

    this.logger.info({
      message: "initCall",
      phone: normalizedPhone,
      code,
      mix: this.useMix,
      voice: this.useMix ? false : this.useVoice,
    })

    const response = await fetch(`${this.apiUrl}/initCall`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.key}.${this.serviceId}`,
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json()) as UCallerInitCallResponse

    if (!data.status) {
      this.logger.error({ message: "uCaller initCall failed", error: data.error, code: data.code_error })
      throw new Error(data.error || "Failed to initiate call")
    }

    this.pendingCodes.set(normalizedPhone, {
      code,
      ucallerId: data.ucaller_id,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    })

    return { ucallerId: data.ucaller_id, code }
  }

  verifyCode(phone: string, code: string): boolean {
    const normalizedPhone = phone.replace(/\D/g, "")
    const pending = this.pendingCodes.get(normalizedPhone)

    if (!pending) return false
    if (Date.now() > pending.expiresAt) {
      this.pendingCodes.delete(normalizedPhone)
      return false
    }

    pending.attempts++
    if (pending.attempts > MAX_VERIFY_ATTEMPTS) {
      this.pendingCodes.delete(normalizedPhone)
      this.logger.warn({ message: "Max verify attempts exceeded", phone: normalizedPhone })
      return false
    }

    if (pending.code !== code) return false

    this.pendingCodes.delete(normalizedPhone)
    return true
  }

  cleanup() {
    const now = Date.now()
    for (const [phone, data] of this.pendingCodes) {
      if (now > data.expiresAt) {
        this.pendingCodes.delete(phone)
      }
    }
  }
}
