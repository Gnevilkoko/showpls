import { useEffect, useState, useRef, useCallback } from "react"

// Максимальный размер bounding box в километрах (примерно 1000км)
const MAX_BOUNDS_SIZE_KM = 1000

// Debounce задержка в миллисекундах
const DEBOUNCE_DELAY_MS = 500

// Функция для расчета расстояния между двумя точками в километрах (формула гаверсинуса)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Радиус Земли в километрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Валидация размера bounding box
function validateBoundsSize(north: number, south: number, east: number, west: number): boolean {
  // Вычисляем размеры по широте и долготе
  const latDistance = calculateDistanceKm(south, (east + west) / 2, north, (east + west) / 2)
  const lngDistance = calculateDistanceKm((north + south) / 2, west, (north + south) / 2, east)

  // Проверяем, что оба размера не превышают максимум
  return latDistance <= MAX_BOUNDS_SIZE_KM && lngDistance <= MAX_BOUNDS_SIZE_KM
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface UseMapBoundsOptions {
  enabled?: boolean // Включен ли хук (по умолчанию true)
  onBoundsChange?: (bounds: MapBounds | null) => void // Callback при изменении bounds
}

/**
 * Хук для получения bounds карты с debounce и валидацией
 * @param getBounds - Функция для получения текущих bounds карты
 * @param options - Опции хука
 * @returns Объект с текущими bounds и состоянием загрузки
 */
export function useMapBounds(
  getBounds: () => MapBounds | null,
  options: UseMapBoundsOptions = {}
): {
  bounds: MapBounds | null
  isValid: boolean
} {
  const { enabled = true, onBoundsChange } = options

  const [bounds, setBounds] = useState<MapBounds | null>(null)
  const [isValid, setIsValid] = useState(false)
  const debounceTimerRef = useRef<number | null>(null)

  const updateBounds = useCallback(() => {
    if (!enabled) {
      setBounds(null)
      setIsValid(false)
      return
    }

    const currentBounds = getBounds()
    if (!currentBounds) {
      setBounds(null)
      setIsValid(false)
      if (onBoundsChange) {
        onBoundsChange(null)
      }
      return
    }

    // Валидация размера bounding box
    const valid = validateBoundsSize(currentBounds.north, currentBounds.south, currentBounds.east, currentBounds.west)

    setIsValid(valid)

    if (valid) {
      setBounds(currentBounds)
      if (onBoundsChange) {
        onBoundsChange(currentBounds)
      }
    } else {
      // Если bounds слишком большие, не обновляем
      setBounds(null)
      if (onBoundsChange) {
        onBoundsChange(null)
      }
    }
  }, [enabled, getBounds, onBoundsChange])

  // Debounce обновления bounds
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      updateBounds()
    }, DEBOUNCE_DELAY_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [updateBounds])

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return { bounds, isValid }
}
