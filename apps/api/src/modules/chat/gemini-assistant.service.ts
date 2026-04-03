import { forwardRef, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import type { Dispatcher } from "undici"
import { fetch as undiciFetch, ProxyAgent } from "undici"
import { Repository } from "typeorm"
import { ChatMessage } from "@share/entities/chat-message.entity"
import { Chat } from "@share/entities/chat.entity"
import { ChatService } from "./chat.service"
import { ChatGateway } from "./chat.gateway"

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

/** Дефолт: 2.0-flash у части новых ключей даёт 404; см. issue python-genai #2087 */
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"

const GEMINI_MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-1.5-flash",
  "gemini-2.0-flash-exp",
] as const

export type GeminiStructuredReply = { answer: boolean; message: string }

type GeminiCallResult =
  | { ok: true; reply: GeminiStructuredReply }
  | { ok: false; userMessage: string; log: string }

/** URL вида http(s)://user:pass@host:port — только для запросов к Gemini. */
function geminiProxyUrisFromEnv(): string[] {
  const primary = process.env.GEMINI_HTTP_PROXY?.trim()
  const fallback = process.env.GEMINI_HTTP_PROXY_FALLBACK?.trim()
  const urls: string[] = []
  if (primary) urls.push(primary)
  if (fallback) urls.push(fallback)
  if (urls.length > 0) return urls

  const host = process.env.GEMINI_PROXY_HOST?.trim()
  const port = process.env.GEMINI_PROXY_PORT?.trim()
  const user = process.env.GEMINI_PROXY_USER?.trim()
  const password = process.env.GEMINI_PROXY_PASSWORD?.trim()
  if (host && port && user && password) {
    const u = encodeURIComponent(user)
    const p = encodeURIComponent(password)
    const main = `http://${u}:${p}@${host}:${port}`
    const portFb = process.env.GEMINI_PROXY_PORT_FALLBACK?.trim()
    if (portFb) return [main, `http://${u}:${p}@${host}:${portFb}`]
    return [main]
  }
  return []
}

@Injectable()
export class GeminiAssistantService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GeminiAssistantService.name)
  private readonly apiKey = process.env.GEMINI_API_KEY?.trim() || ""
  private readonly configuredModel = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL
  private geminiProxyAgents: ProxyAgent[] = []
  /** Пустой список = только прямое соединение; иначе перебор прокси при сетевом сбое */
  private geminiDispatchers: (Dispatcher | undefined)[] = [undefined]

  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepository: Repository<ChatMessage>,
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway
  ) {}

  isEnabled(): boolean {
    return this.apiKey.length > 0
  }

  onModuleInit() {
    const uris = geminiProxyUrisFromEnv()
    if (uris.length > 0) {
      this.geminiProxyAgents = uris.map((uri) => new ProxyAgent(uri))
      this.geminiDispatchers = this.geminiProxyAgents
      const summary = uris.map((uri) => {
        try {
          const u = new URL(uri)
          const auth = u.username ? "с авторизацией" : "без логина"
          const port = u.port || (u.protocol === "https:" ? "443" : "80")
          return `${u.protocol}//${u.hostname}:${port} (${auth})`
        } catch {
          return "[некорректный GEMINI_HTTP_PROXY]"
        }
      })
      this.logger.log(`Gemini: исходящие запросы через прокси: ${summary.join(" → запасной: ")}`)
    }
    if (!this.isEnabled()) {
      this.logger.warn("GEMINI_API_KEY пуст — автоответы поддержки отключены (проверь .env и docker env_file для api)")
    } else {
      const chain = this.modelCandidates().join(" → ")
      this.logger.log(`Gemini включён, приоритет моделей: ${chain}`)
    }
  }

  onModuleDestroy() {
    for (const agent of this.geminiProxyAgents) {
      void agent.close()
    }
  }

  private async geminiPost(url: string, body: object) {
    const opts = {
      method: "POST" as const,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
    const dispatchers = this.geminiDispatchers
    let lastErr: unknown
    for (let i = 0; i < dispatchers.length; i++) {
      const dispatcher = dispatchers[i]
      try {
        return await undiciFetch(url, { ...opts, dispatcher })
      } catch (err) {
        lastErr = err
        const msg = err instanceof Error ? err.message : String(err)
        if (i < dispatchers.length - 1) {
          this.logger.warn(`Gemini: сбой прокси ${i + 1}/${dispatchers.length} (${msg}), пробуем следующий`)
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
  }

  /**
   * Ответ поддержки от Gemini только для чата с Showpls Agent.
   * Не вызывать для сообщений от самого агента / админа.
   */
  async onUserSaysInSupportChat(chatId: string, customerMessageId: string): Promise<void> {
    if (!this.isEnabled()) return

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ["user1", "user2"],
    })
    if (!chat || !(this.chatService.isSupportAgent(chat.user1) || this.chatService.isSupportAgent(chat.user2))) {
      return
    }

    const latest = await this.messageRepository.findOne({
      where: { chat: { id: chatId } },
      order: { createdAt: "DESC" },
      relations: ["sender"],
    })
    if (!latest || latest.id !== customerMessageId) {
      this.logger.debug(`Skip Gemini: not latest message chat=${chatId}`)
      return
    }

    if (this.chatService.isSupportAgent(latest.sender)) {
      return
    }

    const customerId = String(this.chatService.isSupportAgent(chat.user1) ? chat.user2.id : chat.user1.id)
    this.chatGateway.notifyTyping(customerId, chatId, true)

    try {
      const recentDesc = await this.messageRepository.find({
        where: { chat: { id: chatId } },
        relations: ["sender"],
        order: { createdAt: "DESC" },
        take: 10,
      })
      const history = [...recentDesc].reverse()

      const transcript = history
        .filter((m) => m.type === "message" && (m.text?.trim() || m.attachments?.length))
        .map((m) => {
          const line = (m.text?.trim() || (m.attachments?.length ? "[вложение]" : "")).slice(0, 4000)
          if (this.chatService.isSupportAgent(m.sender)) {
            if (m.supportHumanAuthorId) {
              return `[Сотрудник поддержки, человек]: ${line}`
            }
            return `[Ассистент Showpls]: ${line}`
          }
          const who = `${m.sender.firstName ?? ""} ${m.sender.lastName ?? ""}`.trim() || "Пользователь"
          return `[${who}]: ${line}`
        })
        .join("\n")

      const result = await this.callGemini(transcript)
      if (!result.ok) {
        this.logger.warn(result.log)
        await this.chatService.postSupportAssistantMessage(chatId, result.userMessage)
        return
      }
      const { reply } = result
      if (!reply.answer || !reply.message?.trim()) {
        this.logger.debug(`Gemini silenced (answer=false or empty) chat=${chatId}`)
        return
      }

      await this.chatService.postSupportAssistantMessage(chatId, reply.message.trim())
    } finally {
      this.chatGateway.notifyTyping(customerId, chatId, false)
    }
  }

  /** Уникальный список: сначала GEMINI_MODEL / дефолт, затем запасные при 404 */
  private modelCandidates(): string[] {
    const seen = new Set<string>()
    const out: string[] = []
    for (const m of [this.configuredModel, ...GEMINI_MODEL_FALLBACKS]) {
      const id = m.trim()
      if (!id || seen.has(id)) continue
      seen.add(id)
      out.push(id)
    }
    return out
  }

  private async callGemini(transcript: string): Promise<GeminiCallResult> {
    const system = `Ты дружелюбный ассистент поддержки приложения Showpls (маркетплейс задач съёмки/контента).
Помогаешь одному пользователю в переписке. Отвечай кратко и по делу на языке пользователя (ru/en).
Если последнее сообщение явно продолжает диалог с живым сотрудником (в истории есть метка «Сотрудник поддержки, человек» и пользователь отвечает ему), поставь answer=false и message="".

Следуй схеме ответа (только boolean и строка, без текста вокруг JSON).
Если answer=true — в message полезный ответ. Если answer=false — message пустая строка.`

    const models = this.modelCandidates()
    let last404Log = ""

    try {
      for (const modelId of models) {
        const url = GEMINI_ENDPOINT.replace("{model}", encodeURIComponent(modelId))
        const doFetch = (body: object) =>
          this.geminiPost(`${url}?key=${encodeURIComponent(this.apiKey)}`, body)

        let res = await doFetch(contentsPayload(system, transcript))
        if (!res.ok && res.status === 400) {
          const err0 = await res.text().catch(() => "")
          this.logger.warn(
            `Gemini model=${modelId} structured JSON отклонён, повтор без schema: ${err0.slice(0, 400)}`
          )
          res = await doFetch(contentsPayloadJsonOnly(system, transcript))
        }

        if (res.status === 404) {
          const errText = await res.text().catch(() => "")
          last404Log = `Gemini model=${modelId} HTTP 404: ${errText.slice(0, 400)}`
          this.logger.warn(`${last404Log} — пробуем следующую модель`)
          continue
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "")
          const log = `Gemini model=${modelId} HTTP ${res.status}: ${errText.slice(0, 800)}`
          return { ok: false, userMessage: userFacingHttpError(res.status), log }
        }
        const data = (await res.json()) as {
          candidates?: {
            content?: { parts?: { text?: string }[] }
            finishReason?: string
          }[]
          promptFeedback?: { blockReason?: string }
        }
        const first = data.candidates?.[0]
        if (!first?.content?.parts?.length) {
          const log = `Gemini model=${modelId} пустой ответ: finishReason=${first?.finishReason ?? "n/a"} block=${data.promptFeedback?.blockReason ?? "n/a"}`
          return {
            ok: false,
            userMessage:
              "Ассистент не сформировал ответ (ограничение или блокировка запроса). Попробуйте переформулировать или напишите оператору.",
            log,
          }
        }
        const text = first.content.parts.map((p) => p.text).join("") ?? ""
        const parsed = this.parseJsonReply(text)
        if (!parsed) {
          const log = `Gemini model=${modelId} JSON parse fail, raw: ${text.slice(0, 400)}`
          return {
            ok: false,
            userMessage:
              "Не удалось разобрать ответ ассистента. Напишите ещё раз или обратитесь к оператору поддержки.",
            log,
          }
        }
        if (modelId !== this.configuredModel) {
          this.logger.log(`Gemini: использована запасная модель ${modelId} (${this.configuredModel} недоступна)`)
        }
        return { ok: true, reply: parsed }
      }

      const log =
        last404Log ||
        `Gemini: ни одна из моделей не найдена (${models.join(", ")}). Укажите GEMINI_MODEL из списка в Google AI Studio.`
      return {
        ok: false,
        userMessage:
          "Модель ассистента недоступна для этого ключа API. Администратору: обновите GEMINI_MODEL в настройках.",
        log,
      }
    } catch (e) {
      const msg = (e as Error).message
      return {
        ok: false,
        userMessage: "Не удалось связаться с ассистентом. Попробуйте позже или напишите оператору.",
        log: `Gemini request failed: ${msg}`,
      }
    }
  }

  private parseJsonReply(raw: string): GeminiStructuredReply | null {
    let cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim()
    const tryParse = (s: string): GeminiStructuredReply | null => {
      try {
        const obj = JSON.parse(s) as { answer?: unknown; message?: unknown }
        const answer =
          obj.answer === true ||
          obj.answer === "true" ||
          (typeof obj.answer === "string" && obj.answer.toLowerCase() === "true")
        const message = typeof obj.message === "string" ? obj.message : ""
        return { answer, message }
      } catch {
        return null
      }
    }
    const direct = tryParse(cleaned)
    if (direct) return direct
    const m = cleaned.match(/\{[\s\S]*"answer"[\s\S]*"message"[\s\S]*\}/)
    if (m) {
      const fromBrace = tryParse(m[0])
      if (fromBrace) return fromBrace
    }
    this.logger.warn(`Gemini JSON parse fail: ${cleaned.slice(0, 300)}`)
    return null
  }
}

function userFacingHttpError(status: number): string {
  if (status === 429) {
    return "Сервис ассистента временно перегружен. Попробуйте через минуту."
  }
  if (status === 401 || status === 403) {
    return "Ошибка доступа к ассистенту. Обратитесь в поддержку Showpls."
  }
  if (status === 404) {
    return "Модель ассистента недоступна. Проверьте настройки или напишите оператору."
  }
  // Частый случай: неверный ключ, биллинг, регион, неверный запрос к API
  if (status === 400) {
    return "Ассистент отклонил запрос (ошибка API). Проверьте ключ Gemini, биллинг и регион сервера; напишите в поддержку, если проблема не у вас."
  }
  if (status >= 500) {
    return "Сервис ассистента временно недоступен. Попробуйте позже."
  }
  return "Не удалось получить ответ ассистента. Попробуйте ещё раз или напишите оператору."
}

function contentsPayload(system: string, userText: string) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `История чата:\n${userText}\n\nОтветь по схеме (только JSON).` }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      // REST: поле responseJsonSchema, не responseSchema (см. ai.google.dev structured output)
      responseJsonSchema: {
        type: "object",
        properties: {
          answer: { type: "boolean", description: "Писать ли ответ пользователю" },
          message: { type: "string", description: "Текст ответа или пустая строка" },
        },
        required: ["answer", "message"],
      },
    },
  }
}

/** Fallback если модель/регион не принимает responseJsonSchema */
function contentsPayloadJsonOnly(system: string, userText: string) {
  return {
    systemInstruction: { parts: [{ text: system }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `История чата:\n${userText}\n\nОтветь по схеме (только JSON).` }],
      },
    ],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  }
}
