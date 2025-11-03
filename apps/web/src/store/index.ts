import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux"
import userReducer from "./userSlice"
import languageReducer from "./languageSlice"
import themeReducer from "./themeSlice"
import { authApi } from "./authApi"
import { userApi } from "./userApi"

export const store = configureStore({
  reducer: {
    user: userReducer,
    language: languageReducer,
    theme: themeReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(authApi.middleware, userApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
