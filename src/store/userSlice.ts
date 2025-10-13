import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TgUser } from '../shared/types/telegram';

interface UserState {
  tgData: TgUser | null;
}

const initialState: UserState = { tgData: null };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserTg: (state, action: PayloadAction<TgUser | null>) => {
      state.tgData = action.payload;
    },
  },
});

export const { setUserTg } = userSlice.actions;
const userReducer = userSlice.reducer;
export default userReducer;
