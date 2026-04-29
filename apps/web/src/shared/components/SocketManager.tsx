import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector, store } from "../../store"
import { socketService } from "../../services/socketService"
import { setChatTyping } from "../../store/chatTypingSlice"
import { chatApi, chatApiHelpers } from "../../store/api/chatApi"
import { requestApi } from "../../store/api/requestApi"
import { responseApi } from "../../store/api/responseApi"
import { submissionApi } from "../../store/api/submissionApi"
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
      dispatch(setChatTyping({ chatId: data.chatId, typing: false }))
      chatApiHelpers.addMessageToCache(dispatch, data.chatId, data.message)
      const { message } = data
      const requestId = message.requestId
      if (requestId) {
        if (message.variant === "submissionRejected") {
          const reqId = String(requestId)
          // Сразу обновляем кэш, чтобы UI отреагировал без ожидания рефетча
          dispatch(
            requestApi.util.updateQueryData("getRequest", reqId, (draft) => {
              if (draft?.submission) draft.submission = { ...draft.submission, status: "rejected" }
            })
          )
          dispatch(
            submissionApi.util.updateQueryData("getSubmissionByRequest", reqId, (draft) => {
              if (draft) draft.status = "rejected"
            })
          )
          // Инвалидация — подтягиваем актуальное состояние с сервера (на случай расхождения ключей кэша)
          dispatch(requestApi.util.invalidateTags([{ type: "Request", id: reqId }]))
          dispatch(submissionApi.util.invalidateTags([{ type: "Submission", id: `request-${reqId}` }]))
        }
        if (
          message.variant === "newOffer" ||
          message.variant === "responseAccepted" ||
          message.variant === "offerWithdrawn"
        ) {
          dispatch(requestApi.util.invalidateTags([{ type: "Request", id: String(requestId) }]))
        }
      }
    }

    const handleChatUpdate = (data: { chatId: string; updates: Partial<ChatListItem> }) => {
      chatApiHelpers.updateChatInCache(dispatch, data.chatId, data.updates)
    }

    const handleCountersUpdate = (counters: { countUnread: number; countUnreadFavorite: number }) => {
      chatApiHelpers.updateCountersInCache(dispatch, counters)
    }

    const handleOrderStatusChanged = (data: {
      orderId: string
      chatId?: string
      status: string
      escrowStatus?: string
    }) => {
      dispatch(requestApi.util.invalidateTags([{ type: "Request", id: data.orderId }]))
      // Ensure chat UI updates immediately even when backend event has no chatId.
      dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: "LIST" }, { type: "Message", id: "LIST" }]))
      if (data.chatId) {
        dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: data.chatId }, { type: "Message", id: `LIST-${data.chatId}` }]))
      }
    }

    const handleProposalStatusChanged = (data: { proposalId: string; status: string; chatId?: string }) => {
      dispatch(responseApi.util.invalidateTags([{ type: "Response", id: data.proposalId }]))

      if (data.chatId) {
        dispatch(chatApi.util.invalidateTags([{ type: "Chat", id: data.chatId }]))
      }
    }

    const handleChatTyping = (data: { chatId: string; typing: boolean }) => {
      dispatch(setChatTyping({ chatId: data.chatId, typing: data.typing }))
    }

    const handleMessageDeleted = (data: {
      chatId: string
      messageId: string
      lastMessage?: string
      lastUpdate?: string
    }) => {
      chatApiHelpers.removeMessageFromCache(dispatch, data.chatId, data.messageId, {
        lastMessage: data.lastMessage,
        lastUpdate: data.lastUpdate,
      })
    }

    socketService.on("message:new", handleNewMessage)
    socketService.on("chat:typing", handleChatTyping)
    socketService.on("message:deleted", handleMessageDeleted)
    socketService.on("chat:update", handleChatUpdate)
    socketService.on("counters:update", handleCountersUpdate)
    socketService.on("order:status_changed", handleOrderStatusChanged)
    socketService.on("proposal:status_changed", handleProposalStatusChanged)

    return () => {
      socketService.off("message:new", handleNewMessage)
      socketService.off("chat:typing", handleChatTyping)
      socketService.off("message:deleted", handleMessageDeleted)
      socketService.off("chat:update", handleChatUpdate)
      socketService.off("counters:update", handleCountersUpdate)
      socketService.off("order:status_changed", handleOrderStatusChanged)
      socketService.off("proposal:status_changed", handleProposalStatusChanged)
    }
  }, [isConnected, dispatch])

  // Компонент не рендерит ничего
  return null
}

export default SocketManager
