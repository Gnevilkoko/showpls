import { useCallback } from "react"

/**
 * Переиспользуемый хук для конвертации File в base64 строку
 * @returns функция для конвертации файла в base64
 */
export const useFileToBase64 = () => {
  /**
   * Конвертирует File объект в base64 строку (без префикса data:image/...;base64,)
   * @param file - File объект для конвертации
   * @returns Promise с base64 строкой
   * @throws Error если не удалось прочитать файл
   */
  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        try {
          // reader.result это строка вида "data:image/jpeg;base64,/9j/4AAQ..."
          const result = reader.result as string
          // Убираем префикс "data:image/...;base64," и оставляем только base64 строку
          const base64 = result.split(",")[1]

          if (!base64) {
            reject(new Error("Failed to extract base64 string from file"))
            return
          }

          resolve(base64)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }

      reader.readAsDataURL(file)
    })
  }, [])

  /**
   * Конвертирует File объект в base64 строку с префиксом data URL
   * @param file - File объект для конвертации
   * @returns Promise с полной data URL строкой (data:image/...;base64,...)
   */
  const convertToDataURL = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const result = reader.result as string
        resolve(result)
      }

      reader.onerror = () => {
        reject(new Error("Failed to read file"))
      }

      reader.readAsDataURL(file)
    })
  }, [])

  return {
    convertToBase64,
    convertToDataURL,
  }
}
