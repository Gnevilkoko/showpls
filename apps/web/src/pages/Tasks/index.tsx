import { useEffect, useRef, useState, type ChangeEvent } from "react"
import Header from "../../shared/components/Header"
import starsWhiteIcon from "../../assets/icons/status/stars-white.svg"
import pencilIcon from "../../assets/icons/actions/pencil.svg"
import attachIcon from "../../assets/icons/actions/attach.svg"
import locationIcon from "../../assets/icons/ui/location.svg"
import clockIcon from "../../assets/icons/ui/clock.svg"
import coinsIcon from "../../assets/icons/ui/coins.svg"
import plusActionBannerIcon from "../../assets/icons/actions/plus-action-banner.svg"
import searchActionBannerIcon from "../../assets/icons/actions/search-action-banner.svg"
import { useLocation } from "react-router-dom"
import MapContainer from "./MapContainer"
import { TasksList } from "./tasks"
import ToggleProfileMode from "../../shared/components/ToggleProfileMode"
import MiniMapContainer from "./MiniMapContainer"
import { useTranslation } from "react-i18next"
import Navigation from "../../shared/components/Navigation"
import ImageViewer from "../../shared/components/ImageViewer"
import ValidationIcon from "../../shared/components/ValidationIcon"
import type { TaskType, UploadedImageType } from "../../shared/types"
import TaskInfo from "../Chats/components/TaskInfo"
import Modal from "../../shared/components/Modal"

const Tasks = () => {
  const location = useLocation()
  const locationState = location.state
  const { t } = useTranslation()

  const [activeMode, setActiveMode] = useState<"customer" | "performer">(
    locationState?.mode === "createTask" ? "customer" : "performer"
  )

  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const handleClickOption = (val: "list" | "map") => {
    setActiveSection(val)
  }

  // Хранит id активной таски
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Создаём ref для каждой таски в списке и на карте
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const mapTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // При выборе таски из списка
  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId) // отметить активную таску
  }

  // Прокрутка к активной таске в горизонтальном списке под картой
  useEffect(() => {
    if (activeSection === "map" && activeTaskId) {
      const ref = mapTaskRefs.current[activeTaskId]
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", inline: "center" })
      }
    }
  }, [activeSection, activeTaskId])

  // Прокрутка к активной таске при возврате в список
  useEffect(() => {
    if (activeSection === "list" && activeTaskId) {
      const ref = listTaskRefs.current[activeTaskId]
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
  }, [activeSection, activeTaskId])

  const [images, setImages] = useState<UploadedImageType[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // Состояния для валидации инпутов
  const [taskDescription, setTaskDescription] = useState("")
  const [address, setAddress] = useState("")
  const [timeHours, setTimeHours] = useState("")
  const [timeMinutes, setTimeMinutes] = useState("")
  const [budget, setBudget] = useState("")
  const [isHoursDropdownOpen, setIsHoursDropdownOpen] = useState(false)
  const [isMinutesDropdownOpen, setIsMinutesDropdownOpen] = useState(false)

  // Состояние для координат с карты
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: UploadedImageType[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }))

    setImages((prev) => [...prev, ...newImages])
    e.target.value = ""
  }

  const handleRemove = (url: string) => {
    setImages((prev) => prev.filter((img) => img.url !== url))
  }

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null)
  }

  // Генерируем массивы для часов и минут (минуты с шагом 10)
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i)
  const minutesOptions = Array.from({ length: 6 }, (_, i) => i * 10) // 0, 10, 20, 30, 40, 50

  const handleHoursSelect = (hour: number) => {
    setTimeHours(hour.toString())
    setIsHoursDropdownOpen(false)
  }

  const handleMinutesSelect = (minute: number) => {
    setTimeMinutes(minute.toString())
    setIsMinutesDropdownOpen(false)
  }

  // Закрытие выпадающих меню при клике вне их
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".time-selector")) {
        setIsHoursDropdownOpen(false)
        setIsMinutesDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [isUrgent, setIsUrgent] = useState(false)

  // Очищаем время когда toggle выключается
  useEffect(() => {
    if (!isUrgent) {
      setTimeHours("")
      setTimeMinutes("")
      setIsHoursDropdownOpen(false)
      setIsMinutesDropdownOpen(false)
    }
  }, [isUrgent])

  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)

  const handleSelectTask = (task: TaskType) => {
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
  }

  return (
    <div className="page tasks">
      <Header />

      <h1 className="tasks-page-title">
        {activeMode === "customer" ? t("tasksPage.customerTitlePage") : t("tasksPage.performerTitlePage")}
      </h1>

      <ToggleProfileMode activeMode={activeMode} callback={(val: "customer" | "performer") => setActiveMode(val)} />

      {activeMode === "customer" && (
        <>
          <div className="customer-banner">
            <div className="describe__content">
              <div className="customer-banner__title-wrapper">
                <div className="customer-banner__title">
                  <img src={pencilIcon} alt="Pencil Icon" />

                  <span>{t("tasksPage.describeTask")}</span>
                </div>

                <ValidationIcon isValid={taskDescription.trim().length > 10} />
              </div>

              <textarea
                className="describe__input"
                placeholder={t("tasksPage.placeholderTask")}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
              />
            </div>

            <div className="customer-banner__description-container">
              {/* Кнопка загрузки */}
              <label className="describe__upload-button">
                <img src={attachIcon} alt="Attach Icon" />

                <input type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} />
              </label>

              {/* Превью изображений */}
              {images.length !== 0 && (
                <div className="task__attachments">
                  {images.map((img, idx) => (
                    <div key={idx} className="preview-attachments">
                      <img src={img.url} alt={`preview-${idx}`} onClick={() => handleImageClick(idx)} />

                      <button className="btn-remove-img" onClick={() => handleRemove(img.url)}>
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="customer-banner__description">
                  <div className="description__title">{t("tasksPage.addFiles")}</div>

                  <span>{t("tasksPage.filesDescription")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="customer-banner">
            <div className="customer-banner__title-wrapper">
              <div className="customer-banner__title">
                <img src={locationIcon} alt="Location Icon" />

                <span>{t("tasksPage.location")}</span>
              </div>

              <ValidationIcon isValid={mapCoordinates !== null} />
            </div>

            <input
              type="text"
              className="input-location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t("tasksPage.locationPlaceholder")}
            />

            <p className="customer-banner__paragraph">{t("tasksPage.orMarkMap")}</p>

            <MiniMapContainer address={address} onCoordinatesChange={setMapCoordinates} />
          </div>

          <div className="customer-banner">
            <div className="customer-banner__title-wrapper">
              <div className="customer-banner__title">
                <img src={clockIcon} alt="Clock Icon" />

                <span>{t("tasksPage.timeLimit")}</span>
              </div>

              <ValidationIcon
                isValid={
                  !isUrgent ||
                  (timeHours.trim().length > 0 &&
                    timeMinutes.trim().length > 0 &&
                    !(timeHours === "0" && timeMinutes === "0"))
                }
              />
            </div>

            {isUrgent && (
              <div className="time-selectors">
                <div className="time-selector">
                  <div
                    className={`time-dropdown-trigger ${isHoursDropdownOpen ? "open" : ""}`}
                    onClick={() => setIsHoursDropdownOpen(!isHoursDropdownOpen)}
                  >
                    <span>{timeHours ? timeHours.padStart(2, "0") : t("tasksPage.hours")}</span>
                    <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {isHoursDropdownOpen && (
                    <div className="time-dropdown-menu">
                      {hoursOptions.map((hour) => (
                        <div
                          key={hour}
                          className={`time-dropdown-item ${timeHours === hour.toString() ? "selected" : ""}`}
                          onClick={() => handleHoursSelect(hour)}
                        >
                          {hour.toString().padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="time-separator">:</div>

                <div className="time-selector">
                  <div
                    className={`time-dropdown-trigger ${isMinutesDropdownOpen ? "open" : ""}`}
                    onClick={() => setIsMinutesDropdownOpen(!isMinutesDropdownOpen)}
                  >
                    <span>{timeMinutes ? timeMinutes.padStart(2, "0") : t("tasksPage.minutes")}</span>
                    <svg className="dropdown-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {isMinutesDropdownOpen && (
                    <div className="time-dropdown-menu">
                      {minutesOptions.map((minute) => (
                        <div
                          key={minute}
                          className={`time-dropdown-item ${timeMinutes === minute.toString() ? "selected" : ""}`}
                          onClick={() => handleMinutesSelect(minute)}
                        >
                          {minute.toString().padStart(2, "0")}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="customer-banner__description-container">
              <div className="customer-banner__description">
                <span className="description__title">{t("tasksPage.urgent")}</span>

                <span>{t("tasksPage.urgentDescription")}</span>
              </div>

              <div>
                <label className="toggle-switch-urgent">
                  <input type="checkbox" checked={isUrgent} onChange={() => setIsUrgent((val) => !val)} />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>

          <div className="customer-banner">
            <div className="customer-banner__title-wrapper">
              <div className="customer-banner__title">
                <img src={coinsIcon} alt="Coins Icon" />

                <span>{t("tasksPage.budget")}</span>
              </div>

              <ValidationIcon isValid={budget.trim().length > 0} />
            </div>

            <input
              type="number"
              inputMode="numeric" // открывает цифровую клавиатуру на мобилках
              placeholder={t("tasksPage.budgetPlaceholder")}
              className="budget-input"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <button className="customer__btn green">
            <img src={plusActionBannerIcon} alt="Create Request Icon" className="action-banner__icon" />

            <span>{t("tasksPage.publishRequest")}</span>
          </button>

          <button className="customer__btn blue">
            <img src={searchActionBannerIcon} alt="Create Request Icon" className="action-banner__icon" />

            <div className="customer__btn__content">
              <span>{t("tasksPage.findPerformer")}</span>

              <p>{t("tasksPage.sendDirect")}</p>
            </div>
          </button>
        </>
      )}

      {activeMode === "performer" && (
        <div className="performer__container">
          <div className="performer__options">
            <button
              className={`performer__option ${activeSection === "list" ? "active" : ""} `}
              onClick={() => handleClickOption("list")}
            >
              {t("tasksPage.list")}
            </button>

            <button
              className={`performer__option ${activeSection === "map" ? "active" : ""} `}
              onClick={() => handleClickOption("map")}
            >
              {t("tasksPage.map")}
            </button>
          </div>

          {activeSection === "list" &&
            TasksList.map((task) => (
              <div
                key={task.id}
                className="tasks__task"
                ref={(el) => {
                  listTaskRefs.current[task.id] = el
                }}
              >
                <span className="task__header">{task.title}</span>

                <div className="task__container">
                  <div className="task__content">
                    <div className="task__tags-container">
                      {task.isUrgent && <div className="tag badge">{t("urgent")}</div>}

                      <div className="tag stars">
                        {task.price}

                        <span>
                          <img src={starsWhiteIcon} alt="Stars Icon" />
                        </span>
                      </div>

                      {task.tags.map((tag, index) => {
                        if (tag.type === "hLeft") {
                          return (
                            <div key={index} className="tag">
                              {t("tasksPage.hLeft", { count: tag.count })}
                            </div>
                          )
                        }

                        if (tag.type === "km") {
                          return (
                            <div key={index} className="tag">
                              {t("tasksPage.km", { count: tag.count })}
                            </div>
                          )
                        }

                        return null
                      })}
                    </div>

                    <span>{task.description}</span>
                  </div>

                  <button className="task__button" onClick={() => handleSelectTask(task)}>
                    {t("tasksPage.viewDetails")}
                  </button>
                </div>
              </div>
            ))}

          {activeSection === "map" && (
            <>
              <MapContainer
                activeTaskId={activeTaskId} // id активной таски
                setActiveTaskId={setActiveTaskId} // при клике на маркер
              />

              <div className="map-tasks-wrapper">
                <div className="map-tasks-container">
                  {TasksList.map((task) => (
                    <div
                      key={task.id}
                      className="tasks__task"
                      ref={(el) => {
                        mapTaskRefs.current[task.id] = el
                      }}
                      onClick={() => handleTaskClick(task.id)}
                    >
                      <span className="task__header">{task.title}</span>

                      <div className="task__container">
                        <div className="task__content">
                          <div className="task__tags-container">
                            {task.isUrgent && <div className="tag badge">{t("urgent")}</div>}

                            <div className="tag stars">
                              {task.price}

                              <span>
                                <img src={starsWhiteIcon} alt="Stars Icon" />
                              </span>
                            </div>

                            {task.tags.map((tag, index) => {
                              if (tag.type === "hLeft") {
                                return (
                                  <div key={index} className="tag">
                                    {t("tasksPage.hLeft", { count: tag.count })}
                                  </div>
                                )
                              }

                              if (tag.type === "km") {
                                return (
                                  <div key={index} className="tag">
                                    {t("tasksPage.km", { count: tag.count })}
                                  </div>
                                )
                              }

                              return null
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <Navigation />

      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && (
        <ImageViewer
          images={images.map((img) => img.url)}
          currentImageIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
        />
      )}

      <Modal isOpen={selectedTask !== null} onClose={handleCloseTask}>
        <TaskInfo selectedOrder={selectedTask as TaskType} />
      </Modal>
    </div>
  )
}

export default Tasks
