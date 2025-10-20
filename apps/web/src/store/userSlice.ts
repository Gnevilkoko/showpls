import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TgUserType } from '../shared/types';

interface UserState {
  tgData: TgUserType | null;
}

const initialState: UserState = { tgData: null };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserTg: (state, action: PayloadAction<TgUserType | null>) => {
      state.tgData = action.payload;
    },
  },
});

export const { setUserTg } = userSlice.actions;
const userReducer = userSlice.reducer;
export default userReducer;
