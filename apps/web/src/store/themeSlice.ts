import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { AVAILABLE_THEMES } from "../constants"

export type Theme = (typeof AVAILABLE_THEMES)[number]

// Получаем сохраненную тему из localStorage или системную тему
const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem("theme") as Theme | null
  if (savedTheme && AVAILABLE_THEMES.includes(savedTheme)) {
    return savedTheme
  }

  // Если тема не сохранена, проверяем системную тему
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }

  return "light"
}

const initialState: Theme = getInitialTheme()

// Применяем тему к документу
const applyTheme = (theme: Theme) => {
  const root = document.documentElement
  root.setAttribute("data-theme", theme)
  localStorage.setItem("theme", theme)
}

// Применяем начальную тему сразу (до первого рендера)
applyTheme(initialState)

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (_state, action: PayloadAction<Theme>) => {
      const theme = AVAILABLE_THEMES.includes(action.payload) ? action.payload : "light"
      applyTheme(theme)
      return theme
    },
    toggleTheme: (state) => {
      const newTheme: Theme = state === "light" ? "dark" : "light"
      applyTheme(newTheme)
      return newTheme
    },
  },
})

export const { setTheme, toggleTheme } = themeSlice.actions
const themeReducer = themeSlice.reducer

export default themeReducer
