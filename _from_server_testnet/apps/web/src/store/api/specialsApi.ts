import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { SpecialBackend, SpecialsListResponse, SpecialSection } from "../../shared/types/backend"

export interface GetSpecialsParams {
  section: SpecialSection
  limit?: number
  offset?: number
}

export interface GetSpecialsManageParams {
  section?: SpecialSection
  limit?: number
  offset?: number
}

export interface CreateSpecialInput {
  section: SpecialSection
  title: { ru: string; en: string }
  description: { ru: string; en: string }
  steps?: { ru: string; en: string }[]
  partnerName: string
  partnerShort: string
  partnerColor: string
  badge?: { ru: string; en: string } | null
  actionType: "findTask" | "createTask" | "wallet" | "profile"
  actionPayload?: Record<string, unknown> | null
  actionLabel: { ru: string; en: string }
  rewardAmount: number
  rewardCurrencyId?: string
  isActive?: boolean
  startsAt?: string | null
  endsAt?: string | null
  sortOrder?: number
  claimLimitPerUser?: number
  metadata?: Record<string, unknown> | null
}

export type UpdateSpecialInput = Partial<CreateSpecialInput>

export const specialsApi = createApi({
  reducerPath: "specialsApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Special"],
  endpoints: (builder) => ({
    getSpecials: builder.query<SpecialsListResponse, GetSpecialsParams>({
      query: ({ section, limit = 20, offset = 0 }) => ({
        url: "/specials",
        method: "GET",
        params: { section, limit, offset },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Special" as const, id })),
              { type: "Special" as const, id: "LIST" },
            ]
          : [{ type: "Special" as const, id: "LIST" }],
    }),
    getSpecialsManage: builder.query<SpecialsListResponse, GetSpecialsManageParams | void>({
      query: (params = {}) => ({
        url: "/specials/manage",
        method: "GET",
        params: { section: params?.section, limit: params?.limit ?? 100, offset: params?.offset ?? 0 },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: "Special" as const, id })),
              { type: "Special" as const, id: "MANAGE" },
            ]
          : [{ type: "Special" as const, id: "MANAGE" }],
    }),
    getSpecial: builder.query<SpecialBackend, string>({
      query: (id) => ({
        url: `/specials/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Special", id }],
    }),
    createSpecial: builder.mutation<SpecialBackend, CreateSpecialInput>({
      query: (body) => ({
        url: "/specials",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Special", id: "LIST" }, { type: "Special", id: "MANAGE" }],
    }),
    updateSpecial: builder.mutation<SpecialBackend, { id: string; body: UpdateSpecialInput }>({
      query: ({ id, body }) => ({
        url: `/specials/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Special", id },
        { type: "Special", id: "LIST" },
        { type: "Special", id: "MANAGE" },
      ],
    }),
    deleteSpecial: builder.mutation<{ deleted: true }, string>({
      query: (id) => ({
        url: `/specials/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Special", id },
        { type: "Special", id: "LIST" },
        { type: "Special", id: "MANAGE" },
      ],
    }),
  }),
})

export const {
  useGetSpecialsQuery,
  useGetSpecialsManageQuery,
  useGetSpecialQuery,
  useCreateSpecialMutation,
  useUpdateSpecialMutation,
  useDeleteSpecialMutation,
} = specialsApi
