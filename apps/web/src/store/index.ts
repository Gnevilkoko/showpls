import { configureStore, type Middleware } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import userReducer, { type UserState } from "./userSlice"
import languageReducer from "./languageSlice"
import themeReducer from "./themeSlice"
import socketReducer from "./socketSlice"
import chatTypingReducer from "./chatTypingSlice"
import { authApi } from "./api/authApi"
import { userApi } from "./api/userApi"
import { requestApi } from "./api/requestApi"
import { uploadApi } from "./api/uploadApi"
import { chatApi } from "./api/chatApi"
import { responseApi } from "./api/responseApi"
import { submissionApi } from "./api/submissionApi"
import { arbitrationApi } from "./api/arbitrationApi"
import { specialsApi } from "./api/specialsApi"

const AUTH_STORAGE_KEY = "showpls_auth"

const authPersistMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)
  if (
    action.type === "user/setAuthData" ||
    action.type === "user/clearAuthData" ||
    action.type === "user/updateUserPartial"
  ) {
    const state = store.getState().user as UserState
    if (state.accessToken && state.userData) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }
  return result
}

export const store = configureStore({
  reducer: {
    user: userReducer,
    language: languageReducer,
    theme: themeReducer,
    socket: socketReducer,
    chatTyping: chatTypingReducer,
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
      authPersistMiddleware,
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
