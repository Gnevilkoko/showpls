import plusActionBannerIcon from "../../../assets/icons/actions/plus-action-banner.svg"
import searchActionBannerIcon from "../../../assets/icons/actions/search-action-banner.svg"
import { useTranslation } from "react-i18next"
import { useState, useMemo, useCallback, type ChangeEvent } from "react"
import type { APIError, UploadedImageType } from "../../../shared/types"
import ImageViewer from "../../../shared/components/ImageViewer"
import CustomerButton from "../components/CustomerButton"
import DescriptionTaskField from "../components/DescriptionTaskField"
import MapTaskField from "../components/MapTaskField"
import TimeLimitField from "../components/TimeLimitField"
import BudgetField from "../components/BudgetField"
import Modal from "../../../shared/components/Modal"
import PerformersMapGoogle from "../../../shared/components/maps/google/PerformersMapGoogle"
import VerifProofField from "../components/VerifProofField"
import TitleTaskField from "../components/TitleTaskField"
import { useNotification } from "../../../shared/hooks/useNotification"
import { useCreateRequestMutation, type CreateRequestInput } from "../../../store/api/requestApi"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"
import { useUploadFileMutation } from "../../../store/api/uploadApi"
import { toast } from "react-toastify"

const CustomerTaskForm = ({ callback }: { callback: () => void }) => {
  const { t } = useTranslation()
  const notification = useNotification()

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

  const handleChangeVerifProof = (value: "base" | "pro") => {
    setVerifProof(value)
  }

  const [isOpenPerformerDiscover, setIsOpenPerformerDiscover] = useState(false)

  const handleOpenPerformerDiscover = () => {
    setIsOpenPerformerDiscover(true)
  }

  const handleClosePerformerDiscover = () => {
    setIsOpenPerformerDiscover(false)
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

  const [createRequest, { isLoading: isCreating }] = useCreateRequestMutation()
  const [uploadFile] = useUploadFileMutation()

  // Загрузка файлов на сервер
  // TODO: проверить загрузку файлов на сервер когда добавим S3 переменные в .env
  const uploadAttachments = useCallback(
    async (attachments: UploadedImageType[]): Promise<string[]> => {
      const uploadPromises = attachments.map(async (img) => {
        // Если это локальный файл (blob URL), загружаем на сервер
        if (img.url.startsWith("blob:") || img.url.startsWith("http://localhost")) {
          if (!img.file) {
            console.warn("File object not found for image:", img.url)
            return null
          }

          try {
            const uploadResult = await uploadFile(img.file).unwrap()
            return uploadResult.url
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
          return img.url
        }
      })

      const results = await Promise.all(uploadPromises)
      return results.filter((url): url is string => url !== null)
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
    (attachmentUrls: string[], deadlineAt: string | null): CreateRequestInput => {
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
  const handlePublishRequest = useCallback(async () => {
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

      // Создать задачу
      await createRequest(requestData).unwrap()

      // Обработать успех
      notification.showSuccess("taskCreated")

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

      // Если это не ошибка загрузки файлов, обрабатываем как ошибку создания задачи
      if (!isUploadError) {
        // Проверяем, является ли это API ошибкой
        if (NotificationHandler.isAPIError(error)) {
          NotificationHandler.showError(error as APIError)
        } else {
          // Обрабатываем другие типы ошибок
          const errorMessage =
            (error as { data?: { message?: string }; message?: string })?.data?.message ||
            (error as { message?: string })?.message ||
            "Failed to create task"
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
    createRequest,
    callback,
  ])

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

      <CustomerButton
        img={plusActionBannerIcon}
        title={t("tasksPage.publishRequest")}
        color="green"
        onClick={handlePublishRequest}
        disabled={isCreating}
      />

      <CustomerButton
        img={searchActionBannerIcon}
        title={t("tasksPage.findPerformer")}
        description={t("tasksPage.sendDirect")}
        color="blue"
        onClick={handleOpenPerformerDiscover}
      />

      {selectedImageIndex !== null && (
        <ImageViewer
          images={attachmentsList.map((img) => img.url)}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}

      <Modal isOpen={isOpenPerformerDiscover} onClose={handleClosePerformerDiscover}>
        <PerformersMapGoogle />
      </Modal>
    </>
  )
}

export default CustomerTaskForm
