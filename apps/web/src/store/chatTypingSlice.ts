import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

/** chatId → собеседник печатает (сервер: ассистент / в будущем — и др.) */
export type ChatTypingState = Record<string, boolean>

const initialState: ChatTypingState = {}

const chatTypingSlice = createSlice({
  name: "chatTyping",
  initialState,
  reducers: {
    setChatTyping(state, action: PayloadAction<{ chatId: string; typing: boolean }>) {
      const { chatId, typing } = action.payload
      if (!typing) {
        delete state[chatId]
      } else {
        state[chatId] = true
      }
    },
  },
})

export const { setChatTyping } = chatTypingSlice.actions
export default chatTypingSlice.reducer
