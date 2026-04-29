import { useTranslation } from "react-i18next"
import { useEffect, useRef, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import type { TaskType } from "../../../shared/types"
import {
  useCancelRequestMutation,
  useGetRequestQuery,
  useGetRequestListQuery,
  useGetRequestResponsesQuery,
  useRespondToRequestMutation,
} from "../../../store/api/requestApi"
import type { RequestListParams } from "../../../store/api/requestApi"
import { adaptRequestToTask } from "../../../shared/types/adapters"
import { useAppDispatch, useAppSelector, type RootState } from "../../../store"
import { requestApi } from "../../../store/api/requestApi"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"
import { isRequestOwnedByUser } from "../../../shared/utils/requestOwnership"
import Modal from "../../../shared/components/Modal"
import TaskInfo from "../../../shared/components/TaskInfo"
import TaskItem from "../components/TaskItem"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import ToggleSectionButton from "../components/ToggleSectionButton"
import ResponseTaskField from "../components/ResponseTaskField"
import MainMapGoogle from "../../../shared/components/maps/google/MainMapGoogle"
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
interface PerformerDiscoverProps {
  /** ID задачи из URL (?requestId=…) — при открытии по шарингу открываем эту задачу в модалке */
  initialRequestId?: string
  /** Вызывается после того, как задача по initialRequestId открыта (для очистки query из URL) */
  onInitialRequestHandled?: () => void
}

const PerformerDiscover = ({ initialRequestId, onInitialRequestHandled }: PerformerDiscoverProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const userId = useAppSelector((state: RootState) => state.user.userData?.id ?? "")
  const initialRequestHandledRef = useRef(false)

  // Состояния UI
  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [isOpenResponseTask, setIsOpenResponseTask] = useState(false)
  const [isOpenPerformerDiscover, setIsOpenPerformerDiscover] = useState(false)
  const [respondedTaskIds, setRespondedTaskIds] = useState<Set<string>>(new Set())

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
    refetchOnMountOrArgChange: true,
  })

  const { data: requestResponses } = useGetRequestResponsesQuery(selectedTask?.id || "", {
    skip: !isOpenModal || !selectedTask?.id,
  })

  // Fresh request snapshot for strict owner checks in modal actions.
  const [selectedRequestFresh, setSelectedRequestFresh] = useState<any | null>(null)
  const [isLoadingSelectedRequest, setIsLoadingSelectedRequest] = useState(false)

  const [cancelRequest, { isLoading: isCancelling }] = useCancelRequestMutation()
  const [respondToRequest] = useRespondToRequestMutation()

  // Преобразование данных для списка
  const listTasks = useMemo(() => {
    const requests = requestListData?.items || []
    return requests.map((request) => adaptRequestToTask(request))
  }, [requestListData])

  const tasks = listTasks
  const isLoading = isLoadingList
  const error = listError

  // Обновление списка при смене секции
  useEffect(() => {
    refetchList()
  }, [activeSection, refetchList])

  // Задача по ссылке не в первой странице списка — подгружаем по ID
  const [requestIdToFetchFromUrl, setRequestIdToFetchFromUrl] = useState<string | null>(null)
  const { data: initialRequestData } = useGetRequestQuery(requestIdToFetchFromUrl ?? "", {
    skip: !requestIdToFetchFromUrl,
  })

  // Открытие задачи по ссылке (?requestId=…)
  useEffect(() => {
    if (!initialRequestId || initialRequestHandledRef.current) return
    if (isLoading && listTasks.length === 0) return

    const taskInList = listTasks.find((t) => String(t.id) === String(initialRequestId))
    if (taskInList) {
      setActiveSection("list")
      setSelectedTask(taskInList)
      setIsOpenModal(true)
      initialRequestHandledRef.current = true
      onInitialRequestHandled?.()
      return
    }
    if (!requestIdToFetchFromUrl && listTasks.length >= 0) {
      setRequestIdToFetchFromUrl(initialRequestId)
    }
  }, [initialRequestId, listTasks, isLoading, requestIdToFetchFromUrl, onInitialRequestHandled])

  useEffect(() => {
    if (!initialRequestId || !initialRequestData || !requestIdToFetchFromUrl) return
    if (initialRequestHandledRef.current) return
    const task = adaptRequestToTask(initialRequestData)
    setActiveSection("list")
    setSelectedTask(task)
    setIsOpenModal(true)
    setRequestIdToFetchFromUrl(null)
    initialRequestHandledRef.current = true
    onInitialRequestHandled?.()
  }, [initialRequestId, initialRequestData, requestIdToFetchFromUrl, onInitialRequestHandled])

  // Обработчики задач
  const handleSelectTask = (task: TaskType) => {
    setSelectedTask(task)
    setIsOpenModal(true)
  }

  const handleCloseTask = () => {
    setIsOpenModal(false)
    setSelectedTask(null)
    setSelectedRequestFresh(null)
  }

  const handleCancelTask = async (taskId: string) => {
    if (isCancelling) return
    try {
      // Один вызов API: лишний getRequest на мобильных часто падает по сети и маскируется как «ошибка отмены».
      await cancelRequest(taskId).unwrap()
      NotificationHandler.showSuccessTranslated("taskCancelled")
      handleCloseTask()
      if (activeSection === "list") {
        refetchList()
      }
    } catch (err: unknown) {
      const e = err as { status?: number; data?: { message?: string } }
      if (e?.status === 403) {
        NotificationHandler.showErrorTranslated("accessDenied")
        return
      }
      if (
        e?.status === 400 &&
        typeof e?.data?.message === "string" &&
        e.data.message.includes("cannot be cancelled")
      ) {
        NotificationHandler.showSuccessTranslated("taskCancelled")
        handleCloseTask()
        if (activeSection === "list") refetchList()
        return
      }
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
      const freshRequest = await dispatch(
        requestApi.endpoints.getRequest.initiate(taskId, { forceRefetch: true })
      ).unwrap()
      if (isRequestOwnedByUser(freshRequest, userId)) {
        NotificationHandler.showErrorTranslated("cannotRespondOwnTask")
        return
      }

      const response = await respondToRequest({
        requestId: taskId,
        body: { message: responseTaskMessage },
      }).unwrap()

      setRespondedTaskIds((prev) => new Set(prev).add(taskId))

      NotificationHandler.showSuccessTranslated("taskResponded")
      if (activeSection === "list") {
        refetchList()
      }
      handleCloseResponseModal()
      navigate(`/chat/${response.chatId}`)
    } catch (err: any) {
      const status = err?.status
      const code = err?.data?.errorCode || err?.data?.message
      if (status === 409 || code === "RESPONSE_ALREADY_EXISTS" || code === "CONFLICT") {
        NotificationHandler.showErrorTranslated("youAlreadyRespondedToThisTask")
      } else if (status === 400 || code === "INVALID_STATUS") {
        NotificationHandler.showErrorTranslated("taskNoLongerAcceptingResponses")
      } else {
        NotificationHandler.showErrorTranslated("errorRespondingToTask")
      }
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

  useEffect(() => {
    if (!isOpenModal || !selectedTask?.id) {
      setSelectedRequestFresh(null)
      setIsLoadingSelectedRequest(false)
      return
    }

    let cancelled = false
    setIsLoadingSelectedRequest(true)
    void dispatch(
      requestApi.endpoints.getRequest.initiate(selectedTask.id, { forceRefetch: true })
    )
      .unwrap()
      .then((fresh) => {
        if (!cancelled) {
          setSelectedRequestFresh(fresh ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedRequestFresh(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSelectedRequest(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [dispatch, isOpenModal, selectedTask?.id])

  const isTaskOwner = useMemo(() => {
    return isRequestOwnedByUser(selectedRequestFresh, userId)
  }, [selectedRequestFresh, userId])

  // Never trust owner from map/list snapshot for destructive actions.
  const ownerKnown = selectedRequestFresh != null
  const canShowRespondButton = !isTaskOwner && ownerKnown

  const hasAlreadyResponded = selectedTask
    ? respondedTaskIds.has(selectedTask.id) ||
      (requestResponses?.some(
        (response) =>
          String(response.performer?.id) === String(userId) &&
          response.status !== "cancelled" &&
          response.status !== "rejected"
      ) ??
        false)
    : false

  // Условный рендеринг карты
  const MapComponent = MainMapGoogle
  const PerformersMapComponent = PerformersMapGoogle

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

      {activeSection === "map" && error && (
        <div className="status-state-container">
          <span>{t("errorLoadingTasks")}</span>
          <button type="button" onClick={() => void refetchList()} className="task__button">
            {t("retry")}
          </button>
        </div>
      )}

      {activeSection === "map" && (
        <MapComponent
          mode="tasks"
          selectedTask={selectedTask}
          handleSelectTask={handleSelectTask}
          tasksList={tasks}
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
                disabled={isCancelling}
                disabledHint={isCancelling ? `${t("loading")}…` : undefined}
              />
            </>
          ) : canShowRespondButton || !ownerKnown ? (
            <TaskPrimaryButton
              color="green"
              onClick={handleOpenResponseModal}
              icon={penWhiteIcon}
              text={hasAlreadyResponded ? t("alreadyResponded") : t("respondToTheTask")}
              disabled={!ownerKnown || isLoadingSelectedRequest || hasAlreadyResponded || selectedTask?.status !== "published"}
              disabledHint={
                !ownerKnown || isLoadingSelectedRequest
                  ? `${t("loading")}…`
                  : selectedTask?.status !== "published"
                    ? t("taskNoLongerAcceptingResponses")
                    : undefined
              }
            />
          ) : null}
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
