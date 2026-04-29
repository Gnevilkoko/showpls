import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import i18n from "../i18n"
import type { TelegramWebAppUserType } from "../shared/types"
import { userApiEndpoints } from "./api/userApi"

// Получаем список всех доступных языков из i18n
export const AVAILABLE_LANGUAGES = Object.keys(i18n.options.resources || {})

const localLang = localStorage.getItem("lang")

const getInitialLang = (): string => {
  if (localLang && AVAILABLE_LANGUAGES.includes(localLang)) return localLang
  return "en"
}

const initialState: string = getInitialLang()

// Асинхронный thunk для инициализации языка из Telegram
export const initLanguageFromTgAsync = createAsyncThunk(
  "language/initFromTg",
  async (userFromTg: TelegramWebAppUserType | null, { dispatch }) => {
    if (localLang) return localLang // уже выбран

    const tgLang = userFromTg?.language_code
    const langToSet = tgLang && AVAILABLE_LANGUAGES.includes(tgLang) ? tgLang : "en"

    // Если язык из Telegram есть и поддерживается, пытаемся обновить на бекенде

    try {
      await dispatch(
        userApiEndpoints.updateLanguage.initiate({
          language: langToSet as "en" | "ru",
        })
      ).unwrap()
    } catch (error) {
      console.warn("Failed to update language on backend during init:", error)
    }

    // В любом случае сохраняем локально
    localStorage.setItem("lang", langToSet)
    i18n.changeLanguage(langToSet)
    return langToSet
  }
)

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (_state, action: PayloadAction<string>) => {
      const lang = AVAILABLE_LANGUAGES.includes(action.payload) ? action.payload : "en"

      localStorage.setItem("lang", lang)
      i18n.changeLanguage(lang)
      return lang
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initLanguageFromTgAsync.fulfilled, (_state, action) => {
      return action.payload
    })
  },
})

export const { setLanguage } = languageSlice.actions
const languageReducer = languageSlice.reducer

export default languageReducer
