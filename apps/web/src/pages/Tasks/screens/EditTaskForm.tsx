import ImageViewer from "../../../shared/components/ImageViewer"
import BudgetField from "../components/BudgetField"
import DescriptionTaskField from "../components/DescriptionTaskField"
import MapTaskField from "../components/MapTaskField"
import TimeLimitField from "../components/TimeLimitField"
import TitleTaskField from "../components/TitleTaskField"
import VerifProofField from "../components/VerifProofField"
import { useNotification } from "../../../shared/hooks/useNotification"
import { useState, useMemo, useCallback, useEffect, type ChangeEvent } from "react"
import type { APIError, UploadedImageType } from "../../../shared/types"
import { useUpdateRequestMutation, useGetRequestQuery, type UpdateRequestInput } from "../../../store/api/requestApi"
import { useUploadFileMutation } from "../../../store/api/uploadApi"
import { toast } from "react-toastify"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import { useTranslation } from "react-i18next"

// TODO: пока нигде не используется, использовать в списке своих задач в профиле, редактируем только черновики!
/* использование компонента в модальном окне:
<TaskPrimaryButton color="green" onClick={handleEditTask} icon={penWhiteIcon} text={t("editToTask")} />

<Modal
isOpen={isOpenEditTask}
onClose={() => {
  setIsOpenEditTask(false)
  setIsOpenModal(true)
}}
>
{selectedTask && (
  <EditTaskForm
    taskId={selectedTask.id}
    callback={() => {
      setIsOpenEditTask(false)
      setIsOpenModal(true)
      refetch() // Обновляем список задач после редактирования
    }}
  />
)}
</Modal>
*/

const EditTaskForm = ({ callback, taskId }: { callback: () => void; taskId: string }) => {
  const { t } = useTranslation()
  const notification = useNotification()

  // Загрузка данных задачи
  const { data: requestData, isLoading: isLoadingRequest } = useGetRequestQuery(taskId)

  // Состояния для валидации инпутов
  const [taskTitle, setTaskTitle] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [attachmentsList, setAttachmentsList] = useState<UploadedImageType[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const [address, setAddress] = useState("")
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const [isUrgent, setIsUrgent] = useState(false)
  const [timeHours, setTimeHours] = useState("")
  const [timeMinutes, setTimeMinutes] = useState("")

  const [budget, setBudget] = useState("")

  const [verifProof, setVerifProof] = useState<"base" | "pro">("base")

  // Инициализация формы данными задачи
  useEffect(() => {
    if (requestData) {
      setTaskTitle(requestData.title)
      setTaskDescription(requestData.description)
      setBudget(String(requestData.price))
      setAddress(requestData.address || "")
      setMapCoordinates({ lat: requestData.latitude, lng: requestData.longitude })
      setIsUrgent(requestData.isUrgent)

      // Предзаполнение attachments (существующие файлы с сервера)
      const existingAttachments: UploadedImageType[] = requestData.attachments.map((att) => ({
        url: att.url,
        // file отсутствует для существующих файлов с сервера
      }))
      setAttachmentsList(existingAttachments)

      // Предзаполнение verifProof из metadata
      const verifProofValue = (requestData.metadata?.verifProof as "base" | "pro" | undefined) || "base"
      setVerifProof(verifProofValue)

      // Предзаполнение времени для срочных задач
      if (requestData.isUrgent && requestData.deadlineAt) {
        const deadline = new Date(requestData.deadlineAt)
        const now = new Date()
        const diffMs = deadline.getTime() - now.getTime()

        if (diffMs > 0) {
          const totalMinutes = Math.floor(diffMs / (1000 * 60))
          const hours = Math.floor(totalMinutes / 60)
          const minutes = totalMinutes % 60
          setTimeHours(String(hours))
          setTimeMinutes(String(minutes))
        }
      }
    }
  }, [requestData])

  const handleChangeVerifProof = (value: "base" | "pro") => {
    setVerifProof(value)
  }

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: UploadedImageType[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))

    setAttachmentsList((prev) => [...prev, ...newImages])
    e.target.value = ""
  }

  const handleRemove = (url: string) => {
    setAttachmentsList((prev) => prev.filter((img) => img.url !== url))
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  // Валидация полей формы
  const validation = useMemo(() => {
    const isValidTitle = taskTitle.trim().length >= 3 && taskTitle.trim().length <= 100
    const isValidDescription = taskDescription.trim().length >= 10 && taskDescription.trim().length <= 500
    const isValidAddress = mapCoordinates !== null
    const isValidTime =
      !isUrgent ||
      (timeHours.trim().length > 0 && timeMinutes.trim().length > 0 && !(timeHours === "0" && timeMinutes === "0"))
    const isValidBudget = Number(budget) > 0 && Number(budget) <= 150000

    return {
      isValidTitle,
      isValidDescription,
      isValidAddress,
      isValidTime,
      isValidBudget,
      isValid: isValidTitle && isValidDescription && isValidAddress && isValidTime && isValidBudget,
    }
  }, [taskTitle, taskDescription, mapCoordinates, isUrgent, timeHours, timeMinutes, budget])

  const [warningFields, setWarningFields] = useState<boolean>(false)
  const showWarningOnFields = useCallback(() => {
    setWarningFields(true)
    setTimeout(() => {
      setWarningFields(false)
    }, 10000)
  }, [])

  const [updateRequest] = useUpdateRequestMutation()
  const [uploadFile] = useUploadFileMutation()

  // Загрузка файлов на сервер
  // TODO: проверить загрузку файлов на сервер когда добавим S3 переменные в .env
  const uploadAttachments = useCallback(
    async (attachments: UploadedImageType[]): Promise<string[]> => {
      const urls: string[] = []

      for (const img of attachments) {
        // Если это локальный файл (blob URL), загружаем на сервер
        if (img.url.startsWith("blob:") || img.url.startsWith("http://localhost")) {
          if (!img.file) {
            console.warn("File object not found for image:", img.url)
            continue
          }

          try {
            const uploadResult = await uploadFile(img.file).unwrap()
            urls.push(uploadResult.url)
          } catch (uploadError: unknown) {
            const error = uploadError as {
              data?: unknown
              status?: string | number
              error?: string
              originalStatus?: number
            }

            // Обработка ошибок загрузки
            if (error.status === "PARSING_ERROR" || error.error === "SyntaxError" || error.originalStatus === 503) {
              toast.error(
                "Server error: The server returned an invalid response (503 Service Unavailable). Please check your connection and try again later."
              )
            } else if (error.status === 503 || (typeof error.status === "number" && error.status >= 500)) {
              toast.error(
                `Server error: The server is temporarily unavailable (${error.status}). Please try again later.`
              )
            } else {
              NotificationHandler.showError(uploadError as APIError, `Failed to upload file: ${img.file.name}`)
            }

            throw uploadError // Прерываем процесс при ошибке загрузки
          }
        } else {
          // Если это уже URL с сервера - используем его
          urls.push(img.url)
        }
      }

      return urls
    },
    [uploadFile]
  )

  // Подготовка deadlineAt для срочных задач
  const calculateDeadlineAt = useCallback((): string | null => {
    if (!isUrgent || !timeHours || !timeMinutes) {
      return null
    }

    const hours = parseInt(timeHours, 10)
    const minutes = parseInt(timeMinutes, 10)
    const totalMilliseconds = (hours * 60 + minutes) * 60 * 1000
    const deadlineDate = new Date(Date.now() + totalMilliseconds)

    return deadlineDate.toISOString()
  }, [isUrgent, timeHours, timeMinutes])

  // Подготовка данных для API
  const prepareRequestData = useCallback(
    (attachmentUrls: string[], deadlineAt: string | null): UpdateRequestInput => {
      return {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        price: Number(budget),
        latitude: mapCoordinates!.lat,
        longitude: mapCoordinates!.lng,
        isUrgent,
        deadlineAt,
        address: address.trim() || null,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined,
        metadata: {
          verifProof,
        },
      }
    },
    [taskTitle, taskDescription, budget, mapCoordinates, isUrgent, address, verifProof]
  )

  // Основной обработчик отправки формы
  const handleEditTask = useCallback(async () => {
    // Валидация формы
    if (!validation.isValid) {
      showWarningOnFields()
      notification.showWarning("invalidFields")
      return
    }

    try {
      // Загрузить файлы (если есть)
      const attachmentUrls = await uploadAttachments(attachmentsList)

      // Подготовить deadlineAt для срочных задач
      const deadlineAt = calculateDeadlineAt()

      // Подготовить данные для API
      const requestData = prepareRequestData(attachmentUrls, deadlineAt)

      // Обновить задачу
      await updateRequest({ id: taskId, body: requestData }).unwrap()

      // Обработать успех
      notification.showSuccess("taskUpdated")

      callback()
    } catch (error: unknown) {
      // Проверяем, является ли это ошибкой загрузки файлов (PARSING_ERROR или 503)
      const uploadError = error as {
        status?: string | number
        error?: string
        originalStatus?: number
      }

      const isUploadError =
        uploadError.status === "PARSING_ERROR" ||
        uploadError.error === "SyntaxError" ||
        uploadError.originalStatus === 503 ||
        (typeof uploadError.status === "number" && uploadError.status >= 500)

      // Если это не ошибка загрузки файлов, обрабатываем как ошибку обновления задачи
      if (!isUploadError) {
        // Проверяем, является ли это API ошибкой
        if (NotificationHandler.isAPIError(error)) {
          NotificationHandler.showError(error as APIError)
        } else {
          // Обрабатываем другие типы ошибок
          const errorMessage =
            (error as { data?: { message?: string }; message?: string })?.data?.message ||
            (error as { message?: string })?.message ||
            "Failed to update task"
          NotificationHandler.showError(error as APIError, errorMessage)
        }
      }
    }
  }, [
    validation.isValid,
    showWarningOnFields,
    notification,
    uploadAttachments,
    attachmentsList,
    calculateDeadlineAt,
    prepareRequestData,
    updateRequest,
    taskId,
    callback,
  ])

  // Показываем индикатор загрузки пока загружаются данные задачи
  if (isLoadingRequest) {
    return <div className="status-state-container">{t("loading")}</div>
  }

  // Если данные задачи не загружены, показываем ошибку
  if (!requestData) {
    return <div className="status-state-container">{t("errorLoadingTask")}</div>
  }

  return (
    <>
      <TitleTaskField
        value={taskTitle}
        onChange={setTaskTitle}
        isValid={validation.isValidTitle}
        warningFieldsFlag={warningFields}
      />

      <DescriptionTaskField
        value={taskDescription}
        onChange={setTaskDescription}
        attachmentsList={attachmentsList}
        handleUpload={handleUpload}
        handleImageClick={handleImageClick}
        handleRemove={handleRemove}
        isValid={validation.isValidDescription}
        warningFieldsFlag={warningFields}
      />

      <MapTaskField
        value={address}
        onChange={setAddress}
        setMapCoordinates={setMapCoordinates}
        isValid={validation.isValidAddress}
        warningFieldsFlag={warningFields}
      />

      <TimeLimitField
        isUrgent={isUrgent}
        setIsUrgent={setIsUrgent}
        timeHours={timeHours}
        timeMinutes={timeMinutes}
        setTimeHours={setTimeHours}
        setTimeMinutes={setTimeMinutes}
        isValid={validation.isValidTime}
        warningFieldsFlag={warningFields}
      />

      <VerifProofField
        verifProof={verifProof}
        handleChangeVerifProof={handleChangeVerifProof}
        isValid={true}
        warningFieldsFlag={warningFields}
      />

      <BudgetField
        budget={budget}
        setBudget={setBudget}
        isValid={validation.isValidBudget}
        warningFieldsFlag={warningFields}
      />

      <TaskPrimaryButton color="green" onClick={handleEditTask} icon={penWhiteIcon} text={t("editToTask")} />

      {selectedImageIndex !== null && (
        <ImageViewer
          images={attachmentsList.map((img) => img.url)}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}
    </>
  )
}

export default EditTaskForm
