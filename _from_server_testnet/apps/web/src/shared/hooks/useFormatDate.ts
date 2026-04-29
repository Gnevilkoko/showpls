import { useCallback } from "react"

/**
 * Переиспользуемый хук для форматирования даты из ISO строки
 * @returns функция для форматирования даты в формат "время день.месяц.год"
 */
export const useFormatDate = () => {
  /**
   * Форматирует ISO строку даты в формат "время день.месяц.год" или только время (если сегодня)
   * @param isoString - ISO строка даты (например, "2024-01-15T10:30:00.000Z")
   * @returns Отформатированная строка в формате "10:30" (если сегодня), "10:30 15.01" (если год текущий), или "10:30 15.01.24"
   */
  const formatDate = useCallback((isoString: string): string => {
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) throw new Error("Invalid date string")

      const now = new Date()
      const day = date.getDate()
      const month = date.getMonth()
      const year = date.getFullYear()
      const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
      const isCurrentYear = year === now.getFullYear()

      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      const time = `${hours}:${minutes}`

      if (isToday) return time

      const dayStr = String(day).padStart(2, "0")
      const monthStr = String(month + 1).padStart(2, "0")
      const datePart = isCurrentYear ? `${dayStr}.${monthStr}` : `${dayStr}.${monthStr}.${String(year).slice(-2)}`

      return `${time} ${datePart}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return ""
    }
  }, [])

  /**
   * Форматирует ISO строку даты в формат "время:секунды день.месяц.год" или только время (если сегодня)
   * @param isoString - ISO строка даты
   * @returns Отформатированная строка в формате "10:30:45" (если сегодня), "10:30:45 15.01" (если год текущий), или "10:30:45 15.01.24"
   */
  const formatDateWithSeconds = useCallback((isoString: string): string => {
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) throw new Error("Invalid date string")

      const now = new Date()
      const day = date.getDate()
      const month = date.getMonth()
      const year = date.getFullYear()
      const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear()
      const isCurrentYear = year === now.getFullYear()

      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      const seconds = String(date.getSeconds()).padStart(2, "0")
      const time = `${hours}:${minutes}:${seconds}`

      if (isToday) return time

      const dayStr = String(day).padStart(2, "0")
      const monthStr = String(month + 1).padStart(2, "0")
      const datePart = isCurrentYear ? `${dayStr}.${monthStr}` : `${dayStr}.${monthStr}.${String(year).slice(-2)}`

      return `${time} ${datePart}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return ""
    }
  }, [])

  /**
   * Форматирует ISO строку даты только в дату без времени
   * @param isoString - ISO строка даты
   * @returns Отформатированная строка в формате "15.01.24" или "15.01" (если год текущий)
   */
  const formatDateOnly = useCallback((isoString: string): string => {
    try {
      const date = new Date(isoString)
      if (isNaN(date.getTime())) throw new Error("Invalid date string")

      const day = date.getDate()
      const month = date.getMonth()
      const year = date.getFullYear()
      const isCurrentYear = year === new Date().getFullYear()

      const dayStr = String(day).padStart(2, "0")
      const monthStr = String(month + 1).padStart(2, "0")

      return isCurrentYear ? `${dayStr}.${monthStr}` : `${dayStr}.${monthStr}.${String(year).slice(-2)}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return ""
    }
  }, [])

  return {
    formatDate,
    formatDateWithSeconds,
    formatDateOnly,
  }
}
