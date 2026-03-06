import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import userReducer from "./userSlice"
import languageReducer from "./languageSlice"
import themeReducer from "./themeSlice"
import socketReducer from "./socketSlice"
import { authApi } from "./api/authApi"
import { userApi } from "./api/userApi"
import { requestApi } from "./api/requestApi"
import { uploadApi } from "./api/uploadApi"
import { chatApi } from "./api/chatApi"
import { responseApi } from "./api/responseApi"
import { submissionApi } from "./api/submissionApi"
import { arbitrationApi } from "./api/arbitrationApi"
import { specialsApi } from "./api/specialsApi"

export const store = configureStore({
  reducer: {
    user: userReducer,
    language: languageReducer,
    theme: themeReducer,
    socket: socketReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [requestApi.reducerPath]: requestApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [responseApi.reducerPath]: responseApi.reducer,
    [submissionApi.reducerPath]: submissionApi.reducer,
    [arbitrationApi.reducerPath]: arbitrationApi.reducer,
    [specialsApi.reducerPath]: specialsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      userApi.middleware,
      requestApi.middleware,
      uploadApi.middleware,
      chatApi.middleware,
      responseApi.middleware,
      submissionApi.middleware,
      arbitrationApi.middleware,
      specialsApi.middleware
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
