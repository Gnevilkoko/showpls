import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { SubmissionBackend } from "../../shared/types/backend"

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
  tagTypes: ["Submission", "Request"],
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
      invalidatesTags: (_result, _error, { requestId }) => ["Submission", { type: "Request", id: requestId }],
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

export const { useCreateSubmissionMutation, useGetSubmissionQuery, useGetSubmissionByRequestQuery } = submissionApi

export const submissionApiEndpoints = {
  createSubmission: submissionApi.endpoints.createSubmission,
  getSubmission: submissionApi.endpoints.getSubmission,
  getSubmissionByRequest: submissionApi.endpoints.getSubmissionByRequest,
}
