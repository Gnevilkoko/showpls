import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import userReducer from "./userSlice"
import languageReducer from "./languageSlice"
import themeReducer from "./themeSlice"
import { authApi } from "./api/authApi"
import { userApi } from "./api/userApi"
import { requestApi } from "./api/requestApi"
import { uploadApi } from "./api/uploadApi"

export const store = configureStore({
  reducer: {
    user: userReducer,
    language: languageReducer,
    theme: themeReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [requestApi.reducerPath]: requestApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, userApi.middleware, requestApi.middleware, uploadApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
