import { useTranslation } from "react-i18next"
import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import type { TaskType } from "../../../shared/types"
import {
  useCancelRequestMutation,
  useGetRequestListQuery,
  useGetRequestMapQuery,
  useRespondToRequestMutation,
} from "../../../store/api/requestApi"
import type { RequestListParams } from "../../../store/api/requestApi"
import { adaptRequestToTask, adaptRequestMapItemToTask } from "../../../shared/types/adapters"
import { useAppSelector, type RootState } from "../../../store"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"
import Modal from "../../../shared/components/Modal"
import TaskInfo from "../../../shared/components/TaskInfo"
import TaskItem from "../components/TaskItem"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import ToggleSectionButton from "../components/ToggleSectionButton"
import ResponseTaskField from "../components/ResponseTaskField"
import MainMap2Gis from "../../../shared/components/maps/2Gis/MainMap2Gis"
import MainMapGoogle from "../../../shared/components/maps/google/MainMapGoogle"
import PerformersMap2Gis from "../../../shared/components/maps/2Gis/PerformersMap2Gis"
import PerformersMapGoogle from "../../../shared/components/maps/google/PerformersMapGoogle"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"
import loupeWhiteIcon from "../../../assets/icons/ui/loupe-white.svg"
import closeIcon from "../../../assets/icons/ui/close-icon.svg"

// Константы
const MAX_RESPONSE_MESSAGE_LENGTH = 500
const DEFAULT_FILTERS: RequestListParams = {
  status: "published",
  limit: 20,
  offset: 0,
  sortBy: "createdAt",
  sortOrder: "desc",
}
const DEBOUNCE_DELAY_MS = 500 // Задержка для debounce обновления bounds
const MAX_BOUNDS_SIZE_KM = 1000 // Максимальный размер bounding box в километрах

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

const PerformerDiscover = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useAppSelector((state: RootState) => Number(state.user.userData?.id))
  const language = useSelector((state: RootState) => state.language)
  const isRussian = language === "ru"

  // Состояния UI
  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [isOpenResponseTask, setIsOpenResponseTask] = useState(false)
  const [isOpenPerformerDiscover, setIsOpenPerformerDiscover] = useState(false)

  // Состояния для карты (bounds)
  const [mapBounds, setMapBounds] = useState<{
    north: number
    south: number
    east: number
    west: number
  } | null>(null)
  const debounceTimerRef = useRef<number | null>(null)

  // Состояния формы отклика
  const [responseTaskMessage, setResponseTaskMessage] = useState("")
  const isValidResponseMessage = responseTaskMessage.length <= MAX_RESPONSE_MESSAGE_LENGTH

  // Refs
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // API запросы для списка задач
  const {
    data: requestListData,
    isLoading: isLoadingList,
    error: listError,
    refetch: refetchList,
  } = useGetRequestListQuery(DEFAULT_FILTERS, {
    skip: activeSection !== "list",
    refetchOnMountOrArgChange: true,
  })

  // API запросы для карты (используем bounds)
  const {
    data: requestMapData,
    isLoading: isLoadingMap,
    error: mapError,
  } = useGetRequestMapQuery(
    mapBounds
      ? {
        north: mapBounds.north,
        south: mapBounds.south,
        east: mapBounds.east,
        west: mapBounds.west,
      }
      : // Дефолтные bounds (не будут использованы из-за skip)
      {
        north: 90,
        south: -90,
        east: 180,
        west: -180,
      },
    {
      skip: activeSection !== "map" || !mapBounds,
    }
  )

  const [cancelRequest] = useCancelRequestMutation()
  const [respondToRequest] = useRespondToRequestMutation()

  // Обработчик изменения bounds карты с debounce и валидацией
  const handleBoundsChange = useCallback(
    (bounds: { north: number; south: number; east: number; west: number } | null) => {
      // Очищаем предыдущий таймер
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }

      // Устанавливаем новый таймер
      debounceTimerRef.current = window.setTimeout(() => {
        if (!bounds) {
          setMapBounds(null)
          return
        }

        // Валидация размера bounding box
        const isValid = validateBoundsSize(bounds.north, bounds.south, bounds.east, bounds.west)
        if (isValid) {
          setMapBounds(bounds)
        } else {
          // Если bounds слишком большие, не обновляем (не делаем запрос)
          setMapBounds(null)
        }
        debounceTimerRef.current = null
      }, DEBOUNCE_DELAY_MS)
    },
    []
  )

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Преобразование данных для списка
  const listTasks = useMemo(() => {
    const requests = requestListData?.items || []
    return requests.map((request) => adaptRequestToTask(request))
  }, [requestListData])

  // Преобразование данных для карты
  const mapTasks = useMemo(() => {
    const mapItems = requestMapData || []
    return mapItems.map((item) => adaptRequestMapItemToTask(item))
  }, [requestMapData])

  // Выбираем задачи в зависимости от активной секции
  const tasks = activeSection === "list" ? listTasks : mapTasks
  const isLoading = activeSection === "list" ? isLoadingList : isLoadingMap
  const error = activeSection === "list" ? listError : mapError

  // Обновление списка при смене секции
  useEffect(() => {
    if (activeSection === "list") {
      refetchList()
    }
  }, [activeSection, refetchList])

  // Обработчики задач
  const handleSelectTask = (task: TaskType) => {
    setSelectedTask(task)
    setIsOpenModal(true)
  }

  const handleCloseTask = () => {
    setIsOpenModal(false)
    setSelectedTask(null)
  }

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelRequest(taskId).unwrap()
      NotificationHandler.showSuccessTranslated("taskCancelled")
      handleCloseTask()
      if (activeSection === "list") {
        refetchList()
      }
    } catch {
      NotificationHandler.showErrorTranslated("errorCancellingTask")
    }
  }

  // Обработчики отклика
  const handleOpenResponseModal = () => {
    setIsOpenResponseTask(true)
  }

  const handleCloseResponseModal = () => {
    setIsOpenResponseTask(false)
    setResponseTaskMessage("")
  }

  const handleRespondToTask = async (taskId: string) => {
    try {
      const response = await respondToRequest({
        requestId: taskId,
        body: { message: responseTaskMessage },
      }).unwrap()

      NotificationHandler.showSuccessTranslated("taskResponded")
      if (activeSection === "list") {
        refetchList()
      }
      handleCloseResponseModal()
      navigate(`/chat/${response.chatId}`)
    } catch {
      NotificationHandler.showErrorTranslated("errorRespondingToTask")
    }
  }

  // Обработчики модалки поиска исполнителей
  const handleOpenPerformerDiscover = () => {
    setIsOpenModal(false)
    setIsOpenPerformerDiscover(true)
  }

  const handleClosePerformerDiscover = () => {
    setIsOpenModal(true)
    setIsOpenPerformerDiscover(false)
  }

  // Проверка владельца задачи
  const isTaskOwner = selectedTask?.customer_id === userId

  // Условный рендеринг карты
  const MapComponent = isRussian ? MainMap2Gis : MainMapGoogle
  const PerformersMapComponent = isRussian ? PerformersMap2Gis : PerformersMapGoogle

  return (
    <div className="performer__container">
      <div className="performer__options">
        <ToggleSectionButton
          isActive={activeSection === "list"}
          onClick={() => setActiveSection("list")}
          title={t("tasksPage.list")}
        />

        <ToggleSectionButton
          isActive={activeSection === "map"}
          onClick={() => setActiveSection("map")}
          title={t("tasksPage.map")}
        />
      </div>

      {/* Индикатор загрузки */}
      {activeSection === "list" && isLoading && tasks.length === 0 && (
        <div className="status-state-container">
          <span>{t("loading")}</span>
        </div>
      )}

      {/* Обработка ошибок */}
      {activeSection === "list" && error && (
        <div className="status-state-container">
          <span>{t("errorLoadingTasks")}</span>
          <button
            onClick={() => {
              if (activeSection === "list") {
                refetchList()
              }
            }}
            className="task__button"
          >
            {t("retry")}
          </button>
        </div>
      )}

      {/* Пустое состояние */}
      {activeSection === "list" && tasks.length === 0 && !isLoading && !error && (
        <div className="status-state-container">
          <span>{t("noTasksFound")}</span>
        </div>
      )}

      {/* Список задач */}
      {activeSection === "list" &&
        !isLoading &&
        !error &&
        tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            ref={(el) => {
              listTaskRefs.current[task.id] = el
            }}
            handleSelectTask={handleSelectTask}
          />
        ))}

      {/* Карта */}
      {activeSection === "map" && (
        <MapComponent
          selectedTask={selectedTask}
          handleSelectTask={handleSelectTask}
          tasksList={tasks}
          onBoundsChange={handleBoundsChange}
        />
      )}

      {/* Модалка с деталями задачи */}
      {isOpenModal && selectedTask && (
        <Modal isOpen={isOpenModal} onClose={handleCloseTask}>
          <TaskInfo selectedOrder={selectedTask} />

          {isTaskOwner ? (
            <>
              <TaskPrimaryButton
                color="blue"
                onClick={handleOpenPerformerDiscover}
                icon={loupeWhiteIcon}
                text={t("performerDiscovery")}
              />
              <TaskPrimaryButton
                color="none"
                onClick={() => handleCancelTask(selectedTask.id)}
                icon={closeIcon}
                text={t("deleteTask")}
              />
            </>
          ) : (
            <TaskPrimaryButton
              color="green"
              onClick={handleOpenResponseModal}
              icon={penWhiteIcon}
              text={t("respondToTheTask")}
            />
          )}
        </Modal>
      )}

      {/* Модалка отклика на задачу */}
      {isOpenResponseTask && selectedTask && (
        <Modal isOpen={isOpenResponseTask} onClose={handleCloseResponseModal}>
          <ResponseTaskField
            value={responseTaskMessage}
            onChange={setResponseTaskMessage}
            isValid={isValidResponseMessage}
            handleRespondToTask={() => handleRespondToTask(selectedTask.id)}
          />
        </Modal>
      )}

      {/* Модалка поиска исполнителей */}
      <Modal isOpen={isOpenPerformerDiscover} onClose={handleClosePerformerDiscover}>
        <PerformersMapComponent taskId={selectedTask?.id} />
      </Modal>
    </div>
  )
}

export default PerformerDiscover
