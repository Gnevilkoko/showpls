import { useEffect, useRef } from "react"
import { createRoot } from "react-dom/client"
import type { Root } from "react-dom/client"
import starsWhiteIcon from "../../assets/icons/status/stars-white.svg"
import type { TaskType } from "../../shared/types"

interface MarkerContentProps {
  count: number
  image: string
}

// Компонент контента маркера: отображает цену/иконку или текст "urgent" для активной срочной задачи
const MarkerContent = ({ count, image }: MarkerContentProps) => {
  return (
    <div className="custom-marker__content">
      {count}

      <span>
        <img src={image} alt="Stars Icon" />
      </span>
    </div>
  )
}

interface MarkersLayerProps {
  map: google.maps.Map
  selectedTask: TaskType | null
  onClick: (task: TaskType) => void
  tasksList: TaskType[]
}

const TasksMarkersLayer = ({ map, selectedTask, onClick, tasksList }: MarkersLayerProps) => {
  // Хранилище созданных маркеров по ID задачи (для избежания дублирования при ре-рендере)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  // Хранилище React roots для каждого маркера (для обновления React компонента внутри маркера)
  const rootsRef = useRef<Map<string, Root>>(new Map())

  // Инициализация маркеров: создание маркеров на карте только при первой загрузке карты
  useEffect(() => {
    const initMarkers = async () => {
      // Динамическая загрузка библиотеки маркеров Google Maps (для AdvancedMarkerElement)
      const markerLib = (await google.maps.importLibrary("marker")) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
      }
      const { AdvancedMarkerElement } = markerLib

      tasksList.forEach((task) => {
        // Пропускаем создание, если маркер уже существует (избегаем дублирования)
        if (markersRef.current.has(task.id)) return

        // Создаем DOM элемент для контента маркера
        const content = document.createElement("div")
        content.className = `custom-marker ${task.mode === "pro" ? "accent" : ""}`

        // Создаем React root для рендера React компонента внутрь DOM элемента маркера
        const root = createRoot(content)
        root.render(<MarkerContent count={Number(task.price)} image={starsWhiteIcon} />)

        // Создаем AdvancedMarkerElement и добавляем на карту
        const marker = new AdvancedMarkerElement({
          map,
          position: task.position,
          content,
        })

        // Добавляем обработчик клика на маркер для выбора задачи
        marker.addListener("click", () => onClick(task))

        // Сохраняем маркер и root в ref'ы для последующего обновления/удаления
        markersRef.current.set(task.id, marker)
        rootsRef.current.set(task.id, root)
      })
    }

    initMarkers()
  }, [map, tasksList, selectedTask, onClick])

  return null
}

export default TasksMarkersLayer
