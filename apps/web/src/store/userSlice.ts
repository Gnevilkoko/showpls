import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { UserDataType } from "../shared/types"

const AUTH_STORAGE_KEY = "showpls_auth"

export interface UserState {
  accessToken: string | null
  userData: UserDataType | null
}

function loadAuthFromStorage(): UserState {
  try {
    const s = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!s) return { accessToken: null, userData: null }
    const d = JSON.parse(s) as UserState
    if (d && typeof d.accessToken === "string" && d.userData) return d
  } catch {
    // ignore
  }
  return { accessToken: null, userData: null }
}

const initialState: UserState = loadAuthFromStorage()

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setAuthData: (state, action: PayloadAction<{ accessToken: string; userData: UserDataType }>) => {
      state.accessToken = action.payload.accessToken
      state.userData = action.payload.userData
    },
    clearAuthData: (state) => {
      state.accessToken = null
      state.userData = null
    },
    updateUserPartial: (state, action: PayloadAction<Partial<UserDataType>>) => {
      if (state.userData) {
        state.userData = { ...state.userData, ...action.payload }
      }
    },
  },
})

export const { setAuthData, clearAuthData, updateUserPartial } = userSlice.actions
const userReducer = userSlice.reducer
export default userReducer
