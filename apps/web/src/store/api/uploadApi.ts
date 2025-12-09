import { createApi } from "@reduxjs/toolkit/query/react"
import { authenticatedBaseQuery } from "./baseQuery"

export interface UploadResult {
  url: string
  hash: string
  filename: string
  mimeType: string
  size: number
}

export const uploadApi = createApi({
  reducerPath: "uploadApi",
  baseQuery: authenticatedBaseQuery,
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UploadResult, File>({
      query: (file: File) => {
        const formData = new FormData()
        formData.append("file", file)

        return {
          url: "/upload",
          method: "POST",
          body: formData,
        }
      },
    }),
  }),
})

export const { useUploadFileMutation } = uploadApi
