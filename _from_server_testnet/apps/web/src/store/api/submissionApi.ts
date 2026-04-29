import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { SubmissionBackend } from "../../shared/types/backend"

export interface RejectSubmissionInput {
  requestId: string
}

export interface RejectSubmissionResult {
  submission: SubmissionBackend
}

/**
 * Типы для создания Submission (доказательства выполнения работы)
 */
export interface CreateSubmissionInput {
  requestId: string
  attachments: string[] // URL файлов после загрузки через uploadApi
  proofMeta?: {
    clientGeo?: { latitude: number; longitude: number } | null
  }
}

/**
 * Submission API - работа с доказательствами выполнения работы
 *
 * Submission - это фото/файлы, которые исполнитель загружает для подтверждения
 * выполнения задачи. После загрузки заказчик может принять или отклонить работу.
 *
 * Endpoints:
 * - createSubmission: создание нового Submission (загрузка доказательства)
 * - getSubmission: получение Submission по ID
 * - getSubmissionByRequest: получение последнего Submission для задачи
 */
export const submissionApi = createApi({
  reducerPath: "submissionApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Submission", "Request", "Chat", "Message"],
  endpoints: (builder) => ({
    /**
     * Создание Submission - загрузка доказательства выполнения работы
     * POST /submission/create
     *
     * Перед вызовом нужно загрузить файлы через uploadApi и передать URL-ы
     */
    createSubmission: builder.mutation<SubmissionBackend, CreateSubmissionInput>({
      query: (body) => ({
        url: "/submission/create",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        "Submission",
        { type: "Request", id: requestId },
        "Chat",
        "Message",
      ],
    }),

    /**
     * Отклонение сдачи (только заказчик). Отправляет уведомление в чат исполнителю.
     * POST /submission/reject
     */
    rejectSubmission: builder.mutation<RejectSubmissionResult, RejectSubmissionInput>({
      query: (body) => ({
        url: "/submission/reject",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { requestId }) => [
        "Submission",
        { type: "Request", id: requestId },
        "Chat",
        "Message",
      ],
    }),

    /**
     * Получение Submission по ID
     * GET /submission/:id
     */
    getSubmission: builder.query<SubmissionBackend, string>({
      query: (id) => `/submission/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Submission", id }],
    }),

    /**
     * Получение последнего Submission для задачи
     * GET /submission/request/:requestId
     */
    getSubmissionByRequest: builder.query<SubmissionBackend, string>({
      query: (requestId) => `/submission/request/${requestId}`,
      providesTags: (_result, _error, requestId) => [{ type: "Submission", id: `request-${requestId}` }],
    }),
  }),
})

export const {
  useCreateSubmissionMutation,
  useRejectSubmissionMutation,
  useGetSubmissionQuery,
  useGetSubmissionByRequestQuery,
} = submissionApi

export const submissionApiEndpoints = {
  createSubmission: submissionApi.endpoints.createSubmission,
  rejectSubmission: submissionApi.endpoints.rejectSubmission,
  getSubmission: submissionApi.endpoints.getSubmission,
  getSubmissionByRequest: submissionApi.endpoints.getSubmissionByRequest,
}
