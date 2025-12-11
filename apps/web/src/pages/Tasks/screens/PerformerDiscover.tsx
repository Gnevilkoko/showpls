import { useTranslation } from "react-i18next"
import { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import type { TaskType } from "../../../shared/types"
import {
  useCancelRequestMutation,
  useGetRequestListQuery,
  useRespondToRequestMutation,
} from "../../../store/api/requestApi"
import type { RequestListParams } from "../../../store/api/requestApi"
import { adaptRequestToTask } from "../../../shared/types/adapters"
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

const PerformerDiscover = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userId = useAppSelector((state: RootState) => Number(state.user.userData?.id))
  const language = useSelector((state: RootState) => state.language)
  const isRussian = language === "ru"

  // API запросы и мутации
  const {
    data: requestListData,
    isLoading,
    error,
    refetch,
  } = useGetRequestListQuery(DEFAULT_FILTERS, {
    skip: false,
    refetchOnMountOrArgChange: true,
  })
  const [cancelRequest] = useCancelRequestMutation()
  const [respondToRequest] = useRespondToRequestMutation()

  // Состояния UI
  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [isOpenResponseTask, setIsOpenResponseTask] = useState(false)
  const [isOpenPerformerDiscover, setIsOpenPerformerDiscover] = useState(false)

  // Состояния формы отклика
  const [responseTaskMessage, setResponseTaskMessage] = useState("")
  const isValidResponseMessage = responseTaskMessage.length <= MAX_RESPONSE_MESSAGE_LENGTH

  // Refs
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Преобразование данных
  const tasks = useMemo(() => {
    const requests = requestListData?.items || []
    return requests.map((request) => adaptRequestToTask(request))
  }, [requestListData])

  // Обновление списка при смене секции
  useEffect(() => {
    refetch()
  }, [activeSection, refetch])

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
      refetch()
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
      refetch()
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
          <button onClick={() => refetch()} className="task__button">
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
        <MapComponent selectedTask={selectedTask} handleSelectTask={handleSelectTask} tasksList={tasks} />
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
        <PerformersMapComponent />
      </Modal>
    </div>
  )
}

export default PerformerDiscover
