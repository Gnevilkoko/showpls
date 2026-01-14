import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { ResponseBackend } from "../../shared/types/backend"

/**
 * Типы для принятия отклика
 */
export interface AcceptResponseInput {
  message?: string // Опциональное сообщение при принятии отклика
}

/**
 * Результат принятия отклика
 * Бэкенд возвращает { deal, request }
 */
export interface AcceptResponseResult {
  deal: {
    id: string
    requestId: string
    responseId: string
    status: string
    escrowStatus: string | null
    createdAt: string
    chat: { id: string }
  }
  request: {
    id: string
    status: string
    acceptedAt: string | null
  }
}

/**
 * Response API - работа с откликами на задачи
 *
 * Endpoints:
 * - acceptResponse: принятие отклика и создание сделки
 * - getResponse: получение информации об отклике
 * - getResponses: получение списка откликов (опционально по requestId)
 */
export const responseApi = createApi({
  reducerPath: "responseApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Response", "Deal", "Chat", "Request"],
  endpoints: (builder) => ({
    /**
     * Принятие отклика - создаёт Deal и активирует чат
     * POST /responses/:id/accept
     */
    acceptResponse: builder.mutation<AcceptResponseResult, { responseId: string; body?: AcceptResponseInput }>({
      query: ({ responseId, body }) => ({
        url: `/responses/${responseId}/accept`,
        method: "POST",
        body: body || {},
      }),
      invalidatesTags: (_result, _error, { responseId }) => [
        { type: "Response", id: responseId },
        "Deal",
        "Chat",
        "Request",
      ],
    }),

    /**
     * Получение отклика по ID
     * GET /responses/:id
     */
    getResponse: builder.query<ResponseBackend, string>({
      query: (id) => `/responses/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Response", id }],
    }),

    /**
     * Получение списка откликов (опционально по requestId)
     * GET /responses?requestId=...
     */
    getResponses: builder.query<ResponseBackend[], { requestId?: string }>({
      query: (params) => ({
        url: "/responses",
        method: "GET",
        params: params.requestId ? { requestId: params.requestId } : undefined,
      }),
      providesTags: (result, _error, { requestId }) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Response" as const, id })),
              { type: "Response" as const, id: requestId ? `LIST-${requestId}` : "LIST" },
            ]
          : [{ type: "Response" as const, id: "LIST" }],
    }),
  }),
})

export const { useAcceptResponseMutation, useGetResponseQuery, useGetResponsesQuery } = responseApi

export const responseApiEndpoints = {
  acceptResponse: responseApi.endpoints.acceptResponse,
  getResponse: responseApi.endpoints.getResponse,
  getResponses: responseApi.endpoints.getResponses,
}
