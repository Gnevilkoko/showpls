import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type {
  RequestBackend,
  RequestStatus,
  ResponseBackend,
  RequestMapItem,
  PerformerNearby,
  CompleteRequestResponse,
} from "../../shared/types/backend"

// Типы для создания задачи
export interface CreateRequestInput {
  title: string
  description: string
  price: number
  latitude: number
  longitude: number
  expiresAt?: string | null // ISO string или null
  deadlineAt?: string | null // ISO string или null (только для urgent)
  attachments?: string[] // Массив URL файлов (после загрузки через uploadApi)
  metadata?: Record<string, unknown>
  isUrgent?: boolean
  address?: string | null
}

export interface CreateDirectRequestInput extends CreateRequestInput {
  performerId: string // ID исполнителя для прямого предложения
}

// Типы для обновления задачи
// Используем type вместо interface, так как это просто алиас для Partial<CreateRequestInput>
export type UpdateRequestInput = Partial<CreateRequestInput>

// Типы для списка задач
// Все параметры опциональны, но рекомендуется указывать limit для пагинации
// Если не указаны геопараметры (north/south/east/west или latitude/longitude/radius),
// то возвращаются задачи без фильтрации по геолокации
export interface RequestListParams {
  // Фильтры по статусу и роли
  status?: RequestStatus | string // Можно передать строку для фильтрации
  myTasks?: "customer" | "performer" | "both" // Фильтр по роли

  // Геофильтры (bounding box) - все 4 параметра нужны вместе
  north?: number // Bounding box для карты (обязательно вместе с south/east/west)
  south?: number
  east?: number
  west?: number

  // Альтернативный геофильтр (центр + радиус)
  radius?: number // Радиус поиска в км (требует latitude/longitude)
  latitude?: number // Центр поиска (требует longitude и radius)
  longitude?: number

  // Пагинация (рекомендуется указывать limit, по умолчанию бекенд может вернуть все)
  limit?: number // Количество записей (рекомендуется: 20-50)
  offset?: number // Смещение для пагинации (по умолчанию: 0)

  // Сортировка
  sortBy?: "createdAt" | "price" | "distance" // По умолчанию: "createdAt"
  sortOrder?: "asc" | "desc" // По умолчанию: "desc"
}

export interface RequestListResponse {
  items: RequestBackend[]
  total: number
  limit: number
  offset: number
}

// Типы для карты
// Все геопараметры обязательны для корректной работы карты
export interface RequestMapParams {
  north: number // Обязательно: северная граница
  south: number // Обязательно: южная граница
  east: number // Обязательно: восточная граница
  west: number // Обязательно: западная граница
  zoom?: number // Опционально: уровень зума для оптимизации запроса
}

// Типы для отклика
export interface RespondToRequestInput {
  message?: string | null
}

// Типы для завершения задачи
export interface CompleteRequestInput {
  rating?: number // 1-5
  feedback?: string | null
}

export const requestApi = createApi({
  reducerPath: "requestApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Request", "Response", "Deal", "Chat"],
  endpoints: (builder) => ({
    // Endpoint для создания задачи
    createRequest: builder.mutation<RequestBackend, CreateRequestInput>({
      query: (body) => ({
        url: "/request/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Request"],
    }),

    // Endpoint для создания прямого предложения
    createDirectRequest: builder.mutation<
      RequestBackend & { chatId: string; responseId: string },
      CreateDirectRequestInput
    >({
      query: (body) => ({
        url: "/request/create-direct",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Request", "Chat"], // Создается чат
    }),

    // Endpoint для получения списка задач
    getRequestList: builder.query<RequestListResponse, RequestListParams>({
      query: (params) => {
        // Применяем дефолтные значения, если не указаны
        const queryParams: Record<string, unknown> = {
          // Убираем undefined значения
          ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null)),
        }

        // Дефолтные значения для пагинации (если не указаны)
        if (!queryParams.limit) {
          queryParams.limit = 20 // Дефолтное значение
        }
        if (queryParams.offset === undefined) {
          queryParams.offset = 0 // Дефолтное значение
        }

        // Дефолтные значения для сортировки (если не указаны)
        if (!queryParams.sortBy) {
          queryParams.sortBy = "createdAt"
        }
        if (!queryParams.sortOrder) {
          queryParams.sortOrder = "desc"
        }

        return {
          url: "/request/list",
          method: "GET",
          params: queryParams,
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Request" as const, id })),
              { type: "Request" as const, id: "LIST" },
            ]
          : [{ type: "Request" as const, id: "LIST" }],
    }),

    // Endpoint для получения списка задач на карте
    // Возвращает упрощенную версию задач для отображения на карте
    getRequestMap: builder.query<RequestMapItem[], RequestMapParams>({
      query: (params) => ({
        url: "/request/map",
        method: "GET",
        params: {
          north: params.north,
          south: params.south,
          east: params.east,
          west: params.west,
        },
      }),
      providesTags: (result) => (result ? result.map(({ id }) => ({ type: "Request" as const, id })) : ["Request"]),
    }),

    // Endpoint для получения задачи по ID
    getRequest: builder.query<RequestBackend, string>({
      query: (id) => `/request/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Request", id }],
    }),

    // Endpoint для получения всех откликов на задачу
    getRequestResponses: builder.query<ResponseBackend[], string>({
      query: (id) => `/request/${id}/responses`,
      providesTags: (_result, _error, id) => [
        { type: "Response", id: `LIST-${id}` },
        { type: "Request", id },
      ],
    }),

    // Endpoint для получения списка исполнителей в радиусе задачи
    getNearbyPerformers: builder.query<
      { items: PerformerNearby[] },
      { requestId: string; radius?: number; limit?: number }
    >({
      query: ({ requestId, ...params }) => ({
        url: `/request/${requestId}/nearby-performers`,
        method: "GET",
        params: {
          ...(params.radius && { radius: params.radius }),
          ...(params.limit && { limit: params.limit }),
        },
      }),
    }),

    // Endpoint для отклика на задачу
    respondToRequest: builder.mutation<
      ResponseBackend & { chatId: string },
      { requestId: string; body: RespondToRequestInput }
    >({
      query: ({ requestId, body }) => ({
        url: `/request/${requestId}/respond`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Request", "Response", "Chat"], // Создается чат
    }),

    // Endpoint для редактирования задачи
    updateRequest: builder.mutation<RequestBackend, { id: string; body: UpdateRequestInput }>({
      query: ({ id, body }) => ({
        url: `/request/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Request", id }],
    }),

    // Endpoint для удаления задачи
    deleteRequest: builder.mutation<void, string>({
      query: (id) => ({
        url: `/request/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Request"],
    }),

    // Endpoint для завершения задачи
    completeRequest: builder.mutation<CompleteRequestResponse, { id: string; body: CompleteRequestInput }>({
      query: ({ id, body }) => ({
        url: `/request/${id}/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Request", id },
        "Deal", // Deal меняет статус
      ],
    }),

    // Endpoint для отмены задачи
    cancelRequest: builder.mutation<RequestBackend, string>({
      query: (id) => ({
        url: `/request/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Request", id },
        "Deal", // Deal меняет статус
      ],
    }),
  }),
})

export const {
  useCreateRequestMutation,
  useCreateDirectRequestMutation,
  useGetRequestListQuery,
  useGetRequestMapQuery,
  useGetRequestQuery,
  useGetRequestResponsesQuery,
  useGetNearbyPerformersQuery,
  useRespondToRequestMutation,
  useUpdateRequestMutation,
  useDeleteRequestMutation,
  useCompleteRequestMutation,
  useCancelRequestMutation,
} = requestApi

export const requestApiEndpoints = {
  getRequest: requestApi.endpoints.getRequest,
  getRequestList: requestApi.endpoints.getRequestList,
  getRequestMap: requestApi.endpoints.getRequestMap,
  getRequestResponses: requestApi.endpoints.getRequestResponses,
  createRequest: requestApi.endpoints.createRequest,
  createDirectRequest: requestApi.endpoints.createDirectRequest,
  updateRequest: requestApi.endpoints.updateRequest,
  deleteRequest: requestApi.endpoints.deleteRequest,
  respondToRequest: requestApi.endpoints.respondToRequest,
  completeRequest: requestApi.endpoints.completeRequest,
  cancelRequest: requestApi.endpoints.cancelRequest,
  getNearbyPerformers: requestApi.endpoints.getNearbyPerformers,
}
