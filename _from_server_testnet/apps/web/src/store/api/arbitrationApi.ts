import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { UserInfo } from "../../shared/types/backend"

/**
 * Статусы арбитража
 */
export type ArbitrationStatus = "pending" | "resolved"

/**
 * Действия при разрешении арбитража (только для админов)
 */
export type ArbitrationAction = "approve_cancel" | "complete" | "reject"

/**
 * Типы для создания арбитража
 */
export interface CreateArbitrationInput {
  requestId: string
  reason: string
  attachments?: string[] // Опциональные URL вложений
}

/**
 * Ответ при создании арбитража
 */
export interface CreateArbitrationResponse {
  id: string
  requestId: string
  chatId: string
  status: ArbitrationStatus
  createdAt: string
}

/**
 * Полная информация об арбитраже
 */
export interface ArbitrationDetails {
  id: string
  request: {
    id: string
    title: string
    description: string
    price: number
    status: string
    customer: UserInfo
  }
  chat: {
    id: string
    isArbitration: boolean
  }
  reason: string
  attachments: string[] | null
  status: ArbitrationStatus
  resolution: ArbitrationAction | null
  adminMessage: string | null
  initiator: UserInfo
  resolvedBy: {
    id: string
    firstName: string
    lastName: string | null
  } | null
  createdAt: string
  resolvedAt: string | null
}

/**
 * Список арбитражей (для админов)
 */
export interface ArbitrationListResponse {
  items: ArbitrationDetails[]
  total: number
}

/**
 * Типы для разрешения арбитража (только для админов)
 */
export interface ResolveArbitrationInput {
  action: ArbitrationAction
  message?: string // Комментарий админа
}

export interface ResolveArbitrationResponse {
  id: string
  status: ArbitrationStatus
  action: ArbitrationAction
  request: {
    id: string
    status: string
  }
}

/**
 * Arbitration API - работа с арбитражами
 *
 * Арбитраж создаётся когда возникает спор между заказчиком и исполнителем.
 * Админ присоединяется к чату и разрешает конфликт.
 *
 * Endpoints:
 * - createArbitration: создание арбитража (для пользователей)
 * - getArbitration: получение арбитража по ID
 * - getArbitrationList: список арбитражей (только для админов)
 * - resolveArbitration: разрешение арбитража (только для админов)
 */
export const arbitrationApi = createApi({
  reducerPath: "arbitrationApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Arbitration", "Chat", "Request"],
  endpoints: (builder) => ({
    /**
     * Создание арбитража
     * POST /arbitration/create
     *
     * После создания арбитража:
     * - Чат помечается как isArbitration=true
     * - Request переходит в статус "arbitration"
     * - Админ может присоединиться к чату
     */
    createArbitration: builder.mutation<CreateArbitrationResponse, CreateArbitrationInput>({
      query: (body) => ({
        url: "/arbitration/create",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { requestId }) => ["Arbitration", "Chat", { type: "Request", id: requestId }],
    }),

    /**
     * Получение арбитража по ID
     * GET /arbitration/:id
     */
    getArbitration: builder.query<ArbitrationDetails, string>({
      query: (id) => `/arbitration/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Arbitration", id }],
    }),

    /**
     * Получение списка арбитражей (только для админов)
     * GET /arbitration/list
     */
    getArbitrationList: builder.query<
      ArbitrationListResponse,
      { status?: ArbitrationStatus; limit?: number; offset?: number }
    >({
      query: (params) => ({
        url: "/arbitration/list",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Arbitration" as const, id })),
              { type: "Arbitration" as const, id: "LIST" },
            ]
          : [{ type: "Arbitration" as const, id: "LIST" }],
    }),

    /**
     * Разрешение арбитража (только для админов)
     * POST /arbitration/:id/resolve
     *
     * Действия:
     * - approve_cancel: одобрить отмену (заказчик сможет отменить)
     * - complete: завершить задачу (деньги переводятся исполнителю)
     * - reject: отклонить арбитраж (задача продолжается)
     */
    resolveArbitration: builder.mutation<
      ResolveArbitrationResponse,
      { arbitrationId: string; body: ResolveArbitrationInput }
    >({
      query: ({ arbitrationId, body }) => ({
        url: `/arbitration/${arbitrationId}/resolve`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { arbitrationId }) => [
        { type: "Arbitration", id: arbitrationId },
        { type: "Arbitration", id: "LIST" },
        "Chat",
        "Request",
      ],
    }),
  }),
})

export const {
  useCreateArbitrationMutation,
  useGetArbitrationQuery,
  useGetArbitrationListQuery,
  useResolveArbitrationMutation,
} = arbitrationApi

export const arbitrationApiEndpoints = {
  createArbitration: arbitrationApi.endpoints.createArbitration,
  getArbitration: arbitrationApi.endpoints.getArbitration,
  getArbitrationList: arbitrationApi.endpoints.getArbitrationList,
  resolveArbitration: arbitrationApi.endpoints.resolveArbitration,
}
