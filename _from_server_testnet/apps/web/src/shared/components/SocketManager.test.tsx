import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render } from "@testing-library/react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"

// Мокируем i18n перед импортом компонентов
vi.mock("../../i18n", () => ({
  default: {
    options: {
      resources: {
        en: {},
        ru: {},
      },
    },
  },
}))

// Мокируем socketService
vi.mock("../../services/socketService", () => ({
  socketService: {
    initialize: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(() => false),
  },
}))

import SocketManager from "./SocketManager"
import { socketService } from "../../services/socketService"
import socketReducer from "../../store/socketSlice"
import userReducer from "../../store/userSlice"

describe("SocketManager", () => {
  let store: ReturnType<typeof configureStore>

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        user: userReducer,
        socket: socketReducer,
      },
      preloadedState: {
        user: {
          accessToken: null,
          userData: null,
        },
        socket: {
          isConnected: false,
          isConnecting: false,
          reconnectAttempts: 0,
          lastError: null,
          socketId: null,
        },
        ...initialState,
      },
    })
  }

  beforeEach(() => {
    store = createMockStore()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize socketService on mount", () => {
    render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    expect(socketService.initialize).toHaveBeenCalledWith(expect.any(Function), expect.any(Function))
  })

  it("should connect when token becomes available", () => {
    store = createMockStore({
      user: {
        accessToken: "new-token-123",
        userData: { id: "1" },
      },
    })

    render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    expect(socketService.connect).toHaveBeenCalled()
  })

  it("should not connect if already connected", () => {
    store = createMockStore({
      user: {
        accessToken: "token-123",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    vi.mocked(socketService.isConnected).mockReturnValue(true)

    render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // connect не должен вызываться, так как уже подключен
    expect(socketService.connect).not.toHaveBeenCalled()
  })

  it("should disconnect when token is removed", () => {
    // Сначала рендерим с токеном
    store = createMockStore({
      user: {
        accessToken: "token-123",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    const { rerender } = render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Обновляем store без токена
    store = createMockStore({
      user: {
        accessToken: null,
        userData: null,
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    rerender(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    expect(socketService.disconnect).toHaveBeenCalled()
  })

  it("should reconnect when token changes", () => {
    // Сначала рендерим с первым токеном
    store = createMockStore({
      user: {
        accessToken: "old-token-123",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    const { rerender } = render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Обновляем store с новым токеном
    store = createMockStore({
      user: {
        accessToken: "new-token-456",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    rerender(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Должен вызвать disconnect(false) и connect()
    expect(socketService.disconnect).toHaveBeenCalledWith(false)
    expect(socketService.connect).toHaveBeenCalled()
  })

  it("should render nothing", () => {
    const { container } = render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    expect(container.firstChild).toBeNull()
  })

  it("should preserve event handlers when reconnecting with new token", () => {
    // Сначала рендерим с первым токеном
    store = createMockStore({
      user: {
        accessToken: "old-token-123",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    const { rerender } = render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Очищаем моки после первого рендера (чтобы не учитывать вызовы при инициализации)
    vi.clearAllMocks()

    // Обновляем store с новым токеном (токен изменился)
    store = createMockStore({
      user: {
        accessToken: "new-token-456",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    rerender(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Должен вызвать disconnect(false) для сохранения обработчиков и connect() для переподключения
    expect(socketService.disconnect).toHaveBeenCalledWith(false)
    expect(socketService.connect).toHaveBeenCalled()
  })

  it("should update token in socket connection when token changes", () => {
    // Сначала рендерим с первым токеном
    store = createMockStore({
      user: {
        accessToken: "old-token-123",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    const { rerender } = render(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Обновляем store с новым токеном
    store = createMockStore({
      user: {
        accessToken: "new-token-456",
        userData: { id: "1" },
      },
      socket: {
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        lastError: null,
        socketId: "socket-id",
      },
    })

    rerender(
      <Provider store={store}>
        <SocketManager />
      </Provider>
    )

    // Должен переподключиться с новым токеном
    expect(socketService.disconnect).toHaveBeenCalledWith(false)
    expect(socketService.connect).toHaveBeenCalled()
  })
})
