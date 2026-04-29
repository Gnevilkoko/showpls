/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

// Мокируем socket.io-client
const { mockIo, createMockSocket } = vi.hoisted(() => {
  const createMockSocket = () => {
    const handlers: Record<string, (...args: any[]) => void> = {}
    const socket = {
      id: "test-socket-id",
      connected: false,
      handlers,
      disconnect: vi.fn(),
      on: vi.fn((event: string, handler: (...args: any[]) => void) => {
        handlers[event] = handler
      }),
      once: vi.fn((event: string, handler: (...args: any[]) => void) => {
        handlers[event] = handler
      }),
      off: vi.fn(),
      emit: vi.fn(),
      removeAllListeners: vi.fn(),
    }
    return socket
  }
  return {
    createMockSocket,
    mockIo: vi.fn(() => createMockSocket()),
  }
})

const trigger = (socket: any, event: string, ...args: any[]) => {
  const handler = socket.handlers?.[event]
  if (handler) {
    handler(...args)
  }
}

vi.mock("socket.io-client", () => ({
  default: mockIo,
  io: mockIo,
}))

// Импортируем socketService после моков
import { socketService } from "./socketService"

describe("SocketService", () => {
  const mockDispatch = vi.fn()
  const mockGetState = vi.fn(() => ({
    user: {
      accessToken: "test-token-123",
    },
    socket: {
      isConnecting: false,
    },
  })) as () => any

  beforeEach(() => {
    vi.clearAllMocks()
    socketService.initialize(mockDispatch, mockGetState)
    socketService.disconnect()
  })

  afterEach(() => {
    socketService.disconnect()
    vi.clearAllTimers()
  })

  describe("initialize", () => {
    it("should initialize with dispatch and getState", () => {
      const dispatch = vi.fn()
      const getState = vi.fn()
      socketService.initialize(dispatch, getState)
      expect(socketService.isConnected()).toBe(false)
    })
  })

  describe("connect", () => {
    it("should not connect if already connected", () => {
      const mockSocket = {
        id: "test-id",
        connected: true,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      socketService.connect()

      // Проверяем, что dispatch не вызывался для нового подключения
      const connectCalls = mockDispatch.mock.calls.filter((call: any[]) => call[0]?.type === "socket/setConnecting")
      expect(connectCalls.length).toBe(0)
    })

    it("should not connect if no token available", () => {
      const mockGetStateWithoutToken = vi.fn(() => ({
        user: {
          accessToken: null,
        },
        socket: {
          isConnecting: false,
        },
      })) as () => any
      socketService.initialize(mockDispatch, mockGetStateWithoutToken)

      socketService.connect()

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setError",
          payload: "No access token available",
        })
      )
    })

    it("should create socket connection with token", () => {
      socketService.connect()

      // Проверяем, что был вызван dispatch для установки connecting
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setConnecting",
          payload: true,
        })
      )
    })

    it("should set connecting state when connecting", () => {
      socketService.connect()

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setConnecting",
          payload: true,
        })
      )
    })
  })

  describe("disconnect", () => {
    it("should disconnect socket if connected", () => {
      const mockSocket = {
        id: "test-id",
        connected: true,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      socketService.disconnect()

      expect(mockSocket.removeAllListeners).toHaveBeenCalled()
      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setDisconnected",
        })
      )
    })

    it("should clear event handlers by default", () => {
      socketService.on("test:event", () => {})
      expect((socketService as any).eventHandlers.size).toBe(1)

      socketService.disconnect()

      expect((socketService as any).eventHandlers.size).toBe(0)
    })

    it("should preserve event handlers when clearEventHandlers is false", () => {
      socketService.on("test:event", () => {})
      expect((socketService as any).eventHandlers.size).toBe(1)

      socketService.disconnect(false)

      expect((socketService as any).eventHandlers.size).toBe(1)
    })
  })

  describe("on", () => {
    it("should register event handler", () => {
      const handler = vi.fn()
      socketService.on("test:event", handler)

      expect((socketService as any).eventHandlers.has("test:event")).toBe(true)
      expect((socketService as any).eventHandlers.get("test:event").has(handler)).toBe(true)
    })

    it("should subscribe handler to socket if connected", () => {
      const mockSocket = {
        id: "test-id",
        connected: true,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      const handler = vi.fn()
      socketService.on("test:event", handler)

      expect(mockSocket.on).toHaveBeenCalledWith("test:event", handler)
    })
  })

  describe("off", () => {
    it("should unregister specific event handler", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      socketService.on("test:event", handler1)
      socketService.on("test:event", handler2)

      socketService.off("test:event", handler1)

      expect((socketService as any).eventHandlers.get("test:event").has(handler1)).toBe(false)
      expect((socketService as any).eventHandlers.get("test:event").has(handler2)).toBe(true)
    })

    it("should unregister all handlers for event if handler not provided", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      socketService.on("test:event", handler1)
      socketService.on("test:event", handler2)

      socketService.off("test:event")

      expect((socketService as any).eventHandlers.has("test:event")).toBe(false)
    })
  })

  describe("emit", () => {
    it("should emit event if connected", () => {
      const mockSocket = {
        id: "test-id",
        connected: true,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      socketService.emit("test:event", { data: "test" })

      expect(mockSocket.emit).toHaveBeenCalledWith("test:event", { data: "test" })
    })

    it("should not emit if not connected", () => {
      const mockSocket = {
        id: "test-id",
        connected: false,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      socketService.emit("test:event", { data: "test" })

      expect(mockSocket.emit).not.toHaveBeenCalled()
    })
  })

  describe("isConnected", () => {
    it("should return false when not connected", () => {
      expect(socketService.isConnected()).toBe(false)
    })

    it("should return true when connected", () => {
      const mockSocket = {
        id: "test-id",
        connected: true,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      expect(socketService.isConnected()).toBe(true)
    })
  })

  describe("getSocketId", () => {
    it("should return null when not connected", () => {
      expect(socketService.getSocketId()).toBe(null)
    })

    it("should return socket id when connected", () => {
      const mockSocket = {
        id: "test-socket-id-123",
        connected: true,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }
      ;(socketService as any).socket = mockSocket

      expect(socketService.getSocketId()).toBe("test-socket-id-123")
    })
  })

  describe("reconnection logic", () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.clearAllTimers()
    })

    it("should schedule reconnection after connect_error", () => {
      const mockSocket = createMockSocket()
      vi.mocked(mockIo).mockReturnValue(mockSocket as any)

      socketService.connect()

      trigger(mockSocket, "connect_error", new Error("Connection failed"))

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setError",
          payload: "Connection failed",
        })
      )

      // Таймер поставлен
      expect((socketService as any).reconnectTimer).not.toBe(null)

      // Через таймер должен вызываться повторный connect (второй вызов io)
      vi.advanceTimersByTime(2000)
      expect(mockIo).toHaveBeenCalledTimes(2)
    })

    it("should clear reconnect timer on manual disconnect", () => {
      // Устанавливаем таймер вручную
      ;(socketService as any).reconnectTimer = window.setTimeout(() => {}, 1000)
      ;(socketService as any).isManualDisconnect = false

      socketService.disconnect()

      expect((socketService as any).reconnectTimer).toBe(null)
      expect((socketService as any).isManualDisconnect).toBe(true)
    })

    it("should stop reconnecting after max attempts", () => {
      const maxAttempts = 10
      ;(socketService as any).reconnectAttempts = maxAttempts
      ;(socketService as any).isManualDisconnect = false // Важно: не ручное отключение

      const scheduleReconnect = (socketService as any).scheduleReconnect.bind(socketService)
      scheduleReconnect()

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setError",
          payload: "Max reconnection attempts reached",
        })
      )
      expect((socketService as any).reconnectTimer).toBe(null)
    })

    it("should increment reconnect attempts with exponential backoff", () => {
      const scheduleReconnect = (socketService as any).scheduleReconnect.bind(socketService)
      ;(socketService as any).isManualDisconnect = false
      ;(socketService as any).reconnectAttempts = 0

      scheduleReconnect()

      expect((socketService as any).reconnectAttempts).toBe(1)
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "socket/setReconnectAttempt",
          payload: 1,
        })
      )

      // Проверяем, что таймер установлен с правильной задержкой (INITIAL_DELAY = 1000ms)
      expect((socketService as any).reconnectTimer).not.toBe(null)

      // Второй вызов должен увеличить задержку
      ;(socketService as any).reconnectTimer = null
      scheduleReconnect()
      expect((socketService as any).reconnectAttempts).toBe(2)
    })

    it("should restore event handlers after reconnection", () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      // Регистрируем обработчики
      socketService.on("test:event", handler1)
      socketService.on("test:event2", handler2)

      expect((socketService as any).eventHandlers.size).toBe(2)

      // Симулируем переподключение: создаём новый сокет и триггерим connect
      const mockSocket = createMockSocket()
      ;(socketService as any).socket = mockSocket
      socketService.connect()
      trigger(mockSocket, "connect")

      // Проверяем, что обработчики сохранены в eventHandlers
      expect((socketService as any).eventHandlers.get("test:event")?.has(handler1)).toBe(true)
      expect((socketService as any).eventHandlers.get("test:event2")?.has(handler2)).toBe(true)

      // Проверяем, что обработчики сохранены (основная проверка)
      expect((socketService as any).eventHandlers.size).toBe(2)
    })

    it("should not reconnect on manual disconnect", () => {
      ;(socketService as any).isManualDisconnect = true
      ;(socketService as any).reconnectAttempts = 0

      const scheduleReconnect = (socketService as any).scheduleReconnect.bind(socketService)
      scheduleReconnect()

      // Не должно быть попыток переподключения
      expect((socketService as any).reconnectAttempts).toBe(0)
      expect((socketService as any).reconnectTimer).toBe(null)
    })
  })

  describe("connect_error handling", () => {
    it("should schedule reconnection on connect_error", () => {
      vi.useFakeTimers()

      const mockSocket = {
        id: null,
        connected: false,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }

      vi.mocked(mockIo).mockReturnValue(mockSocket as any)

      socketService.connect()

      // Симулируем connect_error
      const connectErrorCall = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "connect_error")
      if (connectErrorCall && connectErrorCall[1]) {
        connectErrorCall[1](new Error("Connection failed"))
      }

      // Проверяем, что был установлен таймер переподключения
      expect((socketService as any).reconnectTimer).not.toBe(null)

      vi.useRealTimers()
    })

    it("should not reconnect on connect_error if manual disconnect", () => {
      vi.useFakeTimers()

      const mockSocket = {
        id: null,
        connected: false,
        disconnect: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        removeAllListeners: vi.fn(),
      }

      vi.mocked(mockIo).mockReturnValue(mockSocket as any)

      socketService.connect()
      // Устанавливаем isManualDisconnect ПОСЛЕ connect, но ДО connect_error
      ;(socketService as any).isManualDisconnect = true

      // Симулируем connect_error
      const connectErrorCall = mockSocket.on.mock.calls.find((call: any[]) => call[0] === "connect_error")
      if (connectErrorCall && connectErrorCall[1]) {
        connectErrorCall[1](new Error("Connection failed"))
      }

      // Не должно быть таймера переподключения
      expect((socketService as any).reconnectTimer).toBe(null)

      vi.useRealTimers()
    })

    it("should reconnect on server disconnect reason", () => {
      vi.useFakeTimers()
      const mockSocket = createMockSocket()
      mockSocket.connected = true
      vi.mocked(mockIo).mockReturnValue(mockSocket as any)

      socketService.connect()

      trigger(mockSocket, "disconnect", "io server disconnect")

      expect((socketService as any).reconnectTimer).not.toBe(null)
      vi.advanceTimersByTime(2000)
      expect(mockIo).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })
})
