import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector, store } from "../../store"
import { socketService } from "../../services/socketService"
import { chatApi, chatApiHelpers } from "../../store/api/chatApi"
import type { MessageBackend, ChatListItem } from "../../shared/types/backend"

/**
 * SocketManager - компонент для управления WebSocket подключением
 *
 * Автоматически:
 * - Инициализирует socketService с Redux store
 * - Подключается при наличии токена авторизации
 * - Отключается при отсутствии токена
 * - Переподключается при изменении токена
 */
const SocketManager = () => {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((state) => state.user.accessToken)
  const isConnected = useAppSelector((state) => state.socket.isConnected)
  const previousTokenRef = useRef<string | null>(null)
  const previousConnectionRef = useRef<boolean>(false)

  // Инициализация socketService при первом рендере
  useEffect(() => {
    socketService.initialize(dispatch, () => store.getState())
  }, [dispatch])

  // Управление подключением на основе токена
  useEffect(() => {
    const previousToken = previousTokenRef.current

    // Если токен изменился или появился
    if (accessToken !== previousToken) {
      if (accessToken) {
        // Есть токен - переподключаемся если токен изменился или еще не подключены
        if (previousToken && previousToken !== accessToken) {
          // Токен изменился - переподключаемся с новым токеном
          // Не очищаем eventHandlers, чтобы сохранить зарегистрированные обработчики
          console.log("[SocketManager] Token changed, reconnecting...")
          socketService.disconnect(false)
          socketService.connect()
        } else if (!isConnected && !socketService.isConnected()) {
          // Новый токен - подключаемся
          console.log("[SocketManager] Token available, connecting...")
          socketService.connect()
        }
      } else {
        // Нет токена - отключаемся
        if (isConnected || socketService.isConnected()) {
          console.log("[SocketManager] Token removed, disconnecting...")
          socketService.disconnect()
        }
      }

      previousTokenRef.current = accessToken
    }
  }, [accessToken, isConnected])

  // Инвалидация кэша при переподключении сокета, чтобы загрузить пропущенные сообщения
  useEffect(() => {
    if (isConnected && !previousConnectionRef.current) {
      console.log("[SocketManager] Connection established or restored. Invalidating chat cache...")
      dispatch(chatApi.util.invalidateTags(["Chat", "Message"]))
    }
    previousConnectionRef.current = isConnected
  }, [isConnected, dispatch])

  // Примечание: НЕ отключаем сокет при размонтировании SocketManager,
  // так как он должен работать глобально в течение всей сессии пользователя.
  // Отключение происходит автоматически при удалении токена авторизации.

  // Подписка на глобальные события WebSocket
  useEffect(() => {
    if (!isConnected) return

    const handleNewMessage = (data: { chatId: string; message: MessageBackend }) => {
      chatApiHelpers.addMessageToCache(dispatch, data.chatId, data.message)
    }

    const handleChatUpdate = (data: { chatId: string; updates: Partial<ChatListItem> }) => {
      chatApiHelpers.updateChatInCache(dispatch, data.chatId, data.updates)
    }

    const handleCountersUpdate = (counters: { countUnread: number; countUnreadFavorite: number }) => {
      chatApiHelpers.updateCountersInCache(dispatch, counters)
    }

    socketService.on("message:new", handleNewMessage)
    socketService.on("chat:update", handleChatUpdate)
    socketService.on("counters:update", handleCountersUpdate)

    return () => {
      socketService.off("message:new", handleNewMessage)
      socketService.off("chat:update", handleChatUpdate)
      socketService.off("counters:update", handleCountersUpdate)
    }
  }, [isConnected, dispatch])

  // Компонент не рендерит ничего
  return null
}

export default SocketManager
