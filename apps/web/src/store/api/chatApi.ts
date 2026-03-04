import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type {
  ChatBackend,
  ChatListItem,
  MessageBackend,
  ResponseBackend,
  DealBackend,
} from "../../shared/types/backend"
import type { RootState } from "../index"

/**
 * Helper функция для построения query параметров с дефолтными значениями
 * Убирает undefined и null значения, применяет дефолты
 */
function buildQueryParams(
  params: Record<string, unknown> | undefined,
  defaults: Record<string, unknown>
): Record<string, unknown> {
  const filtered = params
    ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
    : {}
  return { ...defaults, ...filtered }
}

/**
 * Helper функция для получения текста lastMessage из сообщения
 */
function getLastMessageText(message: { text: string | null; attachments?: string[] }): string {
  return message.text || (message.attachments?.length ? "Attachment" : "Message")
}

// Типы для списка чатов
export interface ChatListParams {
  page?: number // Номер страницы (по умолчанию: 1)
  limit?: number // Количество записей (по умолчанию: 10)
  isFavorite?: boolean // Фильтр по избранным
  search?: string // Поиск по имени или сообщению
}

export interface ChatListResponse {
  items: ChatListItem[]
  total: number
  countUnread: number // Общее количество непрочитанных сообщений
  countUnreadFavorite: number // Количество непрочитанных в избранных
}

// Типы для получения чата
export interface ChatParams {
  page?: number // Номер страницы (по умолчанию: 1)
  limit?: number // Количество сообщений (по умолчанию: 50)
  search?: string // Поиск по тексту сообщений
}

export interface ChatResponse {
  chat: ChatBackend
  messages: MessageBackend[]
  deals: DealBackend[] // Все сделки между участниками чата
  responses: ResponseBackend[] // Все отклики для задач в этом чате
  total: number // Общее количество сообщений
  limit: number
  page: number
}

// Типы для отправки сообщения
export interface SendMessageInput {
  text?: string
  attachments?: string[] // Массив URL файлов (после загрузки через uploadApi)
  type?: "message" | "notification" // По умолчанию: "message"
  variant?: "upload" | "newTask" | "permissionToCancel" | "taskCompleted" | "taskCancelled" | null
}

// Типы для переключения избранного
export interface ToggleFavoriteInput {
  isFavorite: boolean
}

export interface ToggleFavoriteResponse {
  chatId: string
  isFavorite: boolean
}

// Типы для отметки прочитанным
export interface MarkReadInput {
  messageIds?: string[] // Если не указано, помечаются все сообщения как прочитанные
}

export interface MarkReadResponse {
  chatId: string
  readCount: number
}

// Типы для присоединения админа
export interface JoinAsAdminResponse {
  chat: {
    id: string
    admin: { id: string; firstName: string; lastName: string | null; avatar: string | null } | null
    isArbitration: boolean
  }
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Chat", "Message"],
  endpoints: (builder) => ({
    // Endpoint для получения списка чатов
    getChatList: builder.query<ChatListResponse, ChatListParams>({
      query: (params) => {
        const queryParams = buildQueryParams(params as Record<string, unknown>, { page: 1, limit: 15 })

        return {
          url: "/chat/list",
          method: "GET",
          params: queryParams,
        }
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${queryArgs.isFavorite || false}-${queryArgs.search || ""}`
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page === 1 || !arg.page) {
          return newItems
        }
        const existingIds = new Set(currentCache.items.map((i) => i.chatId))
        const uniques = newItems.items.filter((i) => !existingIds.has(i.chatId))

        currentCache.items.push(...uniques)
        currentCache.total = newItems.total
        currentCache.countUnread = newItems.countUnread
        currentCache.countUnreadFavorite = newItems.countUnreadFavorite
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page
      },
      providesTags: (result) =>
        result && result.items
          ? [
              ...result.items.map(({ chatId }) => ({ type: "Chat" as const, id: chatId })),
              { type: "Chat" as const, id: "LIST" },
            ]
          : [{ type: "Chat" as const, id: "LIST" }],
    }),

    // Endpoint для получения чата по ID
    getChat: builder.query<ChatResponse, { id: string; params?: ChatParams }>({
      query: ({ id, params }) => {
        const queryParams = buildQueryParams((params || {}) as Record<string, unknown>, { page: 1, limit: 50 })

        return {
          url: `/chat/${id}`,
          method: "GET",
          params: queryParams,
        }
      },
      providesTags: (_result, _error, { id }) => [
        { type: "Chat", id },
        { type: "Message", id: `LIST-${id}` },
      ],
    }),

    // Endpoint для отправки сообщения
    sendMessage: builder.mutation<MessageBackend, { chatId: string; body: SendMessageInput }>({
      query: ({ chatId, body }) => ({
        url: `/chat/${chatId}/message`,
        method: "POST",
        body,
      }),
      // Оптимистичное обновление: сразу показываем сообщение в UI
      async onQueryStarted({ chatId, body }, { dispatch, queryFulfilled, getState }) {
        const state = getState() as RootState
        const currentUser = state.user?.userData

        if (!currentUser) return

        // Получаем данные чата из кэша для определения receiver
        const chatData = chatApi.endpoints.getChat.select({ id: chatId })(state)
        const chat = chatData?.data?.chat

        // Определяем receiver из данных чата (если есть в кэше)
        const receiver =
          chat && chat.user1.id === currentUser.id
            ? chat.user2
            : chat && chat.user2.id === currentUser.id
            ? chat.user1
            : { id: "", firstName: "", lastName: null as string | null, avatar: null as string | null }

        // Создаем временное сообщение для оптимистичного обновления
        const tempMessage: MessageBackend = {
          id: `temp-${Date.now()}`, // Временный ID, будет заменен на реальный после ответа сервера
          type: body.type || "message",
          variant: body.variant || undefined,
          sender: {
            id: currentUser.id,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            avatar: currentUser.avatar,
          },
          receiver, // Используем реальные данные receiver из кэша
          text: body.text || null,
          attachments: body.attachments || [],
          createdAt: new Date().toISOString(),
          isRead: false,
        }

        // Оптимистично обновляем только кэш getChat для открытого чата
        const patchResult = dispatch(
          chatApi.util.updateQueryData("getChat", { id: chatId }, (draft) => {
            if (!draft?.messages) {
              draft.messages = []
            }
            draft.messages.push(tempMessage)
            if (draft.chat) {
              draft.chat.lastMessage = getLastMessageText({ text: body.text || null, attachments: body.attachments })
              draft.chat.lastUpdate = new Date().toISOString()
            }
          })
        )

        try {
          // Ждем ответа сервера
          const { data: serverMessage } = await queryFulfilled

          // Заменяем временное сообщение на реальное
          dispatch(
            chatApi.util.updateQueryData("getChat", { id: chatId }, (draft) => {
              if (!draft?.messages) return

              const index = draft.messages.findIndex((m) => m.id === tempMessage.id)
              if (index !== -1) {
                draft.messages[index] = serverMessage
              } else {
                // Если временное сообщение не найдено, добавляем реальное
                draft.messages.push(serverMessage)
              }
              // Обновляем lastMessage и lastUpdate из ответа сервера
              if (draft.chat) {
                draft.chat.lastMessage = getLastMessageText(serverMessage)
                draft.chat.lastUpdate = serverMessage.createdAt
              }
            })
          )
        } catch {
          // При ошибке откатываем оптимистичное обновление только для getChat
          patchResult?.undo()
        }
      },
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Chat", id: chatId },
        { type: "Chat", id: "LIST" },
        { type: "Message", id: `LIST-${chatId}` },
      ],
    }),

    // Endpoint для переключения избранного
    toggleFavorite: builder.mutation<ToggleFavoriteResponse, { chatId: string; body: ToggleFavoriteInput }>({
      query: ({ chatId, body }) => ({
        url: `/chat/${chatId}/favorite`,
        method: "POST",
        body,
      }),
      // Оптимистичное обновление: обновляем только открытый чат
      async onQueryStarted({ chatId, body }, { dispatch, queryFulfilled }) {
        // Оптимистично обновляем только кэш getChat
        const patchResult = dispatch(
          chatApi.util.updateQueryData("getChat", { id: chatId }, (draft) => {
            draft.chat.isFavorite = body.isFavorite
          })
        )

        try {
          await queryFulfilled
        } catch {
          // При ошибке откатываем оптимистичное обновление
          if (patchResult) {
            patchResult.undo()
          }
        }
      },
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Chat", id: chatId },
        { type: "Chat", id: "LIST" },
      ],
    }),

    // Endpoint для отметки сообщений как прочитанных
    markRead: builder.mutation<MarkReadResponse, { chatId: string; body: MarkReadInput }>({
      query: ({ chatId, body }) => ({
        url: `/chat/${chatId}/read`,
        method: "POST",
        body,
      }),
      // Оптимистичное обновление: обновляем только открытый чат
      async onQueryStarted({ chatId, body }, { dispatch, queryFulfilled, getState }) {
        // Получаем текущего пользователя для определения какие сообщения помечать
        const state = getState() as RootState
        const currentUserId = state.user?.userData?.id

        if (!currentUserId) return

        // Оптимистично обновляем только кэш getChat
        const patchChatResult = dispatch(
          chatApi.util.updateQueryData("getChat", { id: chatId }, (draft) => {
            // Помечаем сообщения как прочитанные
            if (body.messageIds && body.messageIds.length > 0) {
              draft.messages.forEach((msg) => {
                if (body.messageIds!.includes(msg.id) && msg.receiver.id === currentUserId) {
                  msg.isRead = true
                }
              })
            } else {
              // Помечаем все непрочитанные сообщения
              draft.messages.forEach((msg) => {
                if (msg.receiver.id === currentUserId && !msg.isRead) {
                  msg.isRead = true
                }
              })
            }
            // Обновляем счетчик в чате (будет обновлен сервером)
            draft.chat.countUnread = 0
            draft.chat.isRead = true
          })
        )

        try {
          await queryFulfilled
          // После успешного ответа сервер обновит точные счетчики через invalidatesTags
        } catch {
          // При ошибке откатываем оптимистичное обновление
          if (patchChatResult) {
            patchChatResult.undo()
          }
        }
      },
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Chat", id: chatId },
        { type: "Chat", id: "LIST" }, // Обновляем countUnread в списке
        { type: "Message", id: `LIST-${chatId}` },
      ],
    }),

    // Endpoint для присоединения админа к чату (только для админов)
    joinAsAdmin: builder.mutation<JoinAsAdminResponse, string>({
      query: (chatId) => ({
        url: `/chat/${chatId}/join-as-admin`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, chatId) => [
        { type: "Chat", id: chatId },
        { type: "Chat", id: "LIST" },
      ],
    }),

    // Endpoint для создания или получения чата с самим собой (Saved Messages)
    createSavedChat: builder.mutation<{ chatId: string }, void>({
      query: () => ({
        url: `/chat/saved`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),
  }),
})

export const {
  useGetChatListQuery,
  useGetChatQuery,
  useSendMessageMutation,
  useToggleFavoriteMutation,
  useMarkReadMutation,
  useJoinAsAdminMutation,
  useCreateSavedChatMutation,
} = chatApi

export const chatApiEndpoints = {
  getChatList: chatApi.endpoints.getChatList,
  getChat: chatApi.endpoints.getChat,
  sendMessage: chatApi.endpoints.sendMessage,
  toggleFavorite: chatApi.endpoints.toggleFavorite,
  markRead: chatApi.endpoints.markRead,
  joinAsAdmin: chatApi.endpoints.joinAsAdmin,
}

/**
 * Helper функции для синхронизации RTK Query кэша с WebSocket событиями
 * Используйте эти функции в обработчиках WebSocket событий (socketService.on)
 *
 * Пример использования:
 * ```typescript
 * import { chatApiHelpers } from "../../store/api/chatApi"
 * import { useAppDispatch } from "../../store"
 *
 * const dispatch = useAppDispatch()
 *
 * socketService.on("message:new", (data) => {
 *   chatApiHelpers.addMessageToCache(dispatch, data.chatId, data.message)
 * })
 * ```
 */
import type { AppDispatch } from "../index"

export const chatApiHelpers = {
  /**
   * Добавляет новое сообщение в кэш при получении события message:new
   * @param dispatch - Redux dispatch функция (useAppDispatch())
   * @param chatId - ID чата
   * @param message - Новое сообщение от сервера
   */
  addMessageToCache: (dispatch: AppDispatch, chatId: string, message: MessageBackend) => {
    dispatch(
      chatApi.util.invalidateTags([
        { type: "Chat", id: chatId },
        { type: "Message", id: `LIST-${chatId}` },
      ])
    )
  },

  /**
   * Обновляет чат при получении события chat:update
   * @param dispatch - Redux dispatch функция
   * @param chatId - ID чата
   * @param updates - Обновления чата (lastMessage, lastUpdate, countUnread и т.д.)
   */
  updateChatInCache: (dispatch: AppDispatch, chatId: string, updates: Partial<ChatListItem>) => {
    dispatch(
      chatApi.util.updateQueryData("getChat", { id: chatId }, (draft) => {
        // Защитная проверка: если кэш не существует, выходим
        if (!draft?.chat) return

        if (updates.lastMessage !== undefined) {
          draft.chat.lastMessage = updates.lastMessage
        }
        if (updates.lastUpdate !== undefined) {
          draft.chat.lastUpdate = updates.lastUpdate
        }
        if (updates.countUnread !== undefined) {
          draft.chat.countUnread = updates.countUnread
          draft.chat.isRead = updates.countUnread === 0
        }
      })
    )
  },

  /**
   * Обновляет счетчики непрочитанных при получении события counters:update
   * @param dispatch - Redux dispatch функция
   * @param counters - Новые счетчики
   */
  updateCountersInCache: (dispatch: AppDispatch, counters: { countUnread: number; countUnreadFavorite: number }) => {
    dispatch(
      chatApi.util.updateQueryData("getChatList", {}, (draft) => {
        // Защитная проверка: если кэш не существует, выходим
        if (!draft) return

        draft.countUnread = counters.countUnread
        draft.countUnreadFavorite = counters.countUnreadFavorite
      })
    )
  },
}
