import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import i18n from "../i18n"
import type { TelegramWebAppUserType } from "../shared/types"

// Получаем список всех доступных языков из i18n
export const AVAILABLE_LANGUAGES = Object.keys(i18n.options.resources || {})

const localLang = localStorage.getItem("lang")

const getInitialLang = (): string => {
  if (localLang && AVAILABLE_LANGUAGES.includes(localLang)) return localLang
  return "en"
}

const initialState: string = getInitialLang()

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
    initLanguageFromTg: (_state, action: PayloadAction<TelegramWebAppUserType | null>) => {
      if (localLang) return localLang // уже выбран

      const tgLang = action.payload?.language_code
      const langToSet = tgLang && AVAILABLE_LANGUAGES.includes(tgLang) ? tgLang : "en"

      localStorage.setItem("lang", langToSet)
      i18n.changeLanguage(langToSet)
      return langToSet
    },
  },
})

export const { setLanguage, initLanguageFromTg } = languageSlice.actions
const languageReducer = languageSlice.reducer

export default languageReducer
