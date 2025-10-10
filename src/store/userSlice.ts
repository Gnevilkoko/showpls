import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { TgUser } from '../shared/types/telegram';

interface UserState {
  tgData: TgUser | null;
}

const initialState: UserState = { tgData: null };

// thunk для инициализации Telegram-пользователя
export const initUserTg = createAsyncThunk('user/initTg', async () => {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;
  tg.expand();
  return tg.initDataUnsafe?.user || null;
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(
      initUserTg.fulfilled,
      (state, action: PayloadAction<TgUser | null>) => {
        state.tgData = action.payload;
      }
    );
  },
});

const userReducer = userSlice.reducer;
export default userReducer;
