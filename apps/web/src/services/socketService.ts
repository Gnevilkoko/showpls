import { io, type Socket } from "socket.io-client"
import type { AppDispatch, RootState } from "../store"
import { setConnecting, setConnected, setDisconnected, setReconnectAttempt, setError } from "../store/socketSlice"

/**
 * Конфигурация переподключения
 */
const RECONNECT_CONFIG = {
  MAX_ATTEMPTS: 10, // Максимальное количество попыток переподключения
  INITIAL_DELAY: 1000, // Начальная задержка в мс (1 секунда)
  MAX_DELAY: 30000, // Максимальная задержка в мс (30 секунд)
  BACKOFF_MULTIPLIER: 2, // Множитель для экспоненциальной задержки
}

/**
 * SocketService - сервис для управления WebSocket подключением
 *
 * Особенности:
 * - Автоматическое переподключение с экспоненциальной задержкой
 * - Интеграция с Redux store для хранения состояния
 * - Обработка ошибок подключения
 * - Поддержка подписки на события (on/off)
 * - Отправка событий (emit)
 *
 * Пример использования:
 *
 * ```typescript
 * import { socketService } from "../../services/socketService"
 *
 * // Подписка на событие
 * socketService.on("message:new", (data) => {
 *   console.log("New message:", data)
 * })
 *
 * // Отправка события
 * socketService.emit("some:event", { data: "value" })
 *
 * // Отписка от события
 * const handler = (data) => console.log(data)
 * socketService.on("event", handler)
 * socketService.off("event", handler)
 *
 * // Проверка состояния
 * if (socketService.isConnected()) {
 *   console.log("Socket ID:", socketService.getSocketId())
 * }
 * ```
 *
 * Примечание: SocketService автоматически инициализируется через SocketManager
 * компонент, который добавляется в App.tsx. Подключение происходит автоматически
 * при наличии токена авторизации в Redux store.
 */
class SocketService {
  private socket: Socket | null = null
  private dispatch: AppDispatch | null = null
  private getState: (() => RootState) | null = null
  private reconnectAttempts = 0
  private reconnectTimer: number | null = null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map()
  private isManualDisconnect = false
  private socketUrl: string

  constructor() {
    // Определяем URL для WebSocket
    // Используем относительный URL (проксируется через Vite) для development
    // В production бэкенд и фронтенд находятся на одном домене
    const isDev = import.meta.env.DEV
    this.socketUrl = isDev ? "" : window.location.origin
  }

  /**
   * Инициализация сервиса с Redux store
   */
  initialize(dispatch: AppDispatch, getState: () => RootState) {
    this.dispatch = dispatch
    this.getState = getState
  }

  /**
   * Подключение к WebSocket серверу
   */
  connect(): void {
    if (this.socket?.connected) {
      console.warn("[SocketService] Already connected")
      return
    }

    // Проверяем, не идет ли уже процесс подключения (isConnecting)
    const currentState = this.getState?.()
    if (currentState?.socket?.isConnecting) {
      console.warn("[SocketService] Connection already in progress, skipping duplicate connect()")
      return
    }

    const state = this.getState?.()
    const token = state?.user?.accessToken

    if (!token) {
      const errorMsg = "No access token available"
      console.error(`[SocketService] ${errorMsg}`)
      this.dispatch?.(setError(errorMsg))
      return
    }

    // Очищаем старый сокет перед созданием нового (для переподключения)
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }

    this.isManualDisconnect = false
    this.dispatch?.(setConnecting(true))
    this.dispatch?.(setError(null))

    console.log("[SocketService] Connecting to", this.socketUrl)

    // Создаем новое подключение
    this.socket = io(this.socketUrl, {
      path: "/chat/ws",
      transports: ["websocket"],
      auth: {
        token: `Bearer ${token}`,
      },
      query: {
        token: token,
      },
      reconnection: false, // Отключаем автоматическое переподключение socket.io, используем свою логику
    })

    // Обработка успешного подключения
    this.socket.on("connect", () => {
      console.log("[SocketService] Connected, socket ID:", this.socket?.id)
      this.reconnectAttempts = 0
      this.dispatch?.(setConnected({ socketId: this.socket?.id || "" }))
      this.dispatch?.(setReconnectAttempt(0))
      this.clearReconnectTimer()

      // Восстанавливаем все зарегистрированные обработчики при подключении
      // (нужно при переподключении, когда создается новый сокет)
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          // Проверяем, не подписан ли уже этот обработчик (избегаем дублирования)
          if (this.socket) {
            this.socket.on(event, handler)
          }
        })
      })
    })

    // Обработка события "connected" от сервера
    // Используем once() вместо on() чтобы обработчик сработал только один раз
    this.socket.once("connected", (data: { type: string; userId: string; timestamp: string }) => {
      console.log("[SocketService] Server confirmed connection:", data)
    })

    // Обработка отключения
    this.socket.on("disconnect", (reason: string) => {
      console.log("[SocketService] Disconnected, reason:", reason)
      this.dispatch?.(setDisconnected())

      // Очищаем таймер переподключения при ручном отключении
      if (this.isManualDisconnect) {
        this.clearReconnectTimer()
      }

      // Обнуляем сокет для возможности переподключения
      if (this.socket) {
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      }

      // Если это не ручное отключение, пытаемся переподключиться
      if (!this.isManualDisconnect) {
        this.scheduleReconnect()
      }
    })

    // Обработка ошибок подключения
    this.socket.on("connect_error", (error: Error) => {
      console.error("[SocketService] Connection error:", error.message)
      this.dispatch?.(setError(error.message))
      this.dispatch?.(setConnecting(false))

      // Очищаем таймер переподключения при ручном отключении
      if (this.isManualDisconnect) {
        this.clearReconnectTimer()
        return
      }

      // Обнуляем сокет для возможности переподключения
      if (this.socket) {
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      }

      // КРИТИЧНО: При первичной ошибке подключения событие disconnect может не прийти,
      // поэтому планируем переподключение явно здесь
      this.scheduleReconnect()
    })

    // Проксируем все события через наш механизм подписки
    this.setupEventProxy()
  }

  /**
   * Отключение от WebSocket сервера
   * @param clearEventHandlers - очищать ли зарегистрированные обработчики (по умолчанию true)
   */
  disconnect(clearEventHandlers: boolean = true): void {
    this.isManualDisconnect = true
    this.clearReconnectTimer()
    this.reconnectAttempts = 0

    if (this.socket) {
      console.log("[SocketService] Disconnecting...")

      // Удаляем все слушатели событий перед отключением
      this.socket.removeAllListeners()

      // Отключаем сокет
      this.socket.disconnect()
      this.socket = null
    }

    this.dispatch?.(setDisconnected())

    // Очищаем обработчики только если явно указано (при полном отключении)
    // При переподключении (смена токена) обработчики сохраняем
    if (clearEventHandlers) {
      this.eventHandlers.clear()
    }
  }

  /**
   * Подписка на событие
   */
  on<T = unknown>(event: string, handler: (data: T) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    // Подписываемся на событие сокета, если сокет существует и подключен
    // Если сокет еще не подключен, обработчик будет подписан при подключении
    // (см. событие "connect" в методе connect())
    if (this.socket?.connected) {
      this.socket.on(event, handler)
    }
  }

  /**
   * Отписка от события
   */
  off<T = unknown>(event: string, handler?: (data: T) => void): void {
    if (handler) {
      // Отписываемся от конкретного обработчика
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (this.socket) {
          this.socket.off(event, handler)
        }
      }
    } else {
      // Отписываемся от всех обработчиков события
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.forEach((h) => {
          if (this.socket) {
            this.socket.off(event, h)
          }
        })
        handlers.clear()
      }
      this.eventHandlers.delete(event)
    }
  }

  /**
   * Отправка события на сервер
   */
  emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn(`[SocketService] Cannot emit "${event}": socket not connected`)
      return
    }

    this.socket.emit(event, data)
  }

  /**
   * Проверка состояния подключения
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Получение ID сокета
   */
  getSocketId(): string | null {
    return this.socket?.id ?? null
  }

  /**
   * Планирование переподключения с экспоненциальной задержкой
   */
  private scheduleReconnect(): void {
    if (this.isManualDisconnect) {
      return
    }

    if (this.reconnectAttempts >= RECONNECT_CONFIG.MAX_ATTEMPTS) {
      console.error("[SocketService] Max reconnection attempts reached")
      this.dispatch?.(setError("Max reconnection attempts reached"))
      this.dispatch?.(setConnecting(false))
      return
    }

    this.reconnectAttempts++
    this.dispatch?.(setReconnectAttempt(this.reconnectAttempts))

    // Вычисляем задержку с экспоненциальным backoff
    const delay = Math.min(
      RECONNECT_CONFIG.INITIAL_DELAY * Math.pow(RECONNECT_CONFIG.BACKOFF_MULTIPLIER, this.reconnectAttempts - 1),
      RECONNECT_CONFIG.MAX_DELAY
    )

    console.log(`[SocketService] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)

    this.clearReconnectTimer()
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  /**
   * Очистка таймера переподключения
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * Настройка проксирования событий для обработчиков, зарегистрированных через on()
   *
   * Примечание: Обработчики, зарегистрированные через on(), автоматически
   * подписываются на события сокета, так как мы вызываем socket.on() напрямую.
   * Этот метод оставлен для возможных будущих улучшений.
   */
  private setupEventProxy(): void {
    // Метод оставлен для возможных будущих улучшений
    // Текущая реализация on() уже подписывает обработчики напрямую на сокет
  }
}

// Экспортируем singleton экземпляр
export const socketService = new SocketService()
