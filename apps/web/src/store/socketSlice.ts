import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface SocketState {
  isConnected: boolean
  isConnecting: boolean
  reconnectAttempts: number
  lastError: string | null
  socketId: string | null
}

const initialState: SocketState = {
  isConnected: false,
  isConnecting: false,
  reconnectAttempts: 0,
  lastError: null,
  socketId: null,
}

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    setConnecting: (state, action: PayloadAction<boolean>) => {
      state.isConnecting = action.payload
    },
    setConnected: (state, action: PayloadAction<{ socketId: string }>) => {
      state.isConnected = true
      state.isConnecting = false
      state.socketId = action.payload.socketId
      state.reconnectAttempts = 0
      state.lastError = null
    },
    setDisconnected: (state) => {
      state.isConnected = false
      state.isConnecting = false
      state.socketId = null
    },
    setReconnectAttempt: (state, action: PayloadAction<number>) => {
      state.reconnectAttempts = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.lastError = action.payload
    },
    resetSocketState: () => {
      return initialState
    },
  },
})

export const { setConnecting, setConnected, setDisconnected, setReconnectAttempt, setError, resetSocketState } =
  socketSlice.actions
const socketReducer = socketSlice.reducer
export default socketReducer
