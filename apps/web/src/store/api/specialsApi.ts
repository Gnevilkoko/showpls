import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"
import type { SpecialBackend, SpecialsListResponse, SpecialSection } from "../../shared/types/backend"

export interface GetSpecialsParams {
  section: SpecialSection
  limit?: number
  offset?: number
}

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
    getSpecial: builder.query<SpecialBackend, string>({
      query: (id) => ({
        url: `/specials/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Special", id }],
    }),
  }),
})

export const { useGetSpecialsQuery, useGetSpecialQuery } = specialsApi
