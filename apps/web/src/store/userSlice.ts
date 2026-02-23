import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { UserDataType } from "../shared/types"

interface UserState {
  accessToken: string | null
  userData: UserDataType | null
}

const initialState: UserState = {
  accessToken: null,
  userData: null,
}

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
