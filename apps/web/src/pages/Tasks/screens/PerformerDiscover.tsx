import { useTranslation } from "react-i18next"
import MapContainer from "../MapContainer"
import { TasksList } from "../tasks"
import { useEffect, useRef, useState } from "react"
import type { TaskType } from "../../../shared/types"
import Modal from "../../../shared/components/Modal"
import TaskInfo from "../../../shared/components/TaskInfo"
import ToggleSectionButton from "../components/ToggleSectionButton"
import TaskItem from "../components/TaskItem"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"

const PerformerDiscover = () => {
  const { t } = useTranslation()

  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  // Хранит id активной таски
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Создаём ref для каждой таски в списке и на карте
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const mapTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleSelectTask = (task: TaskType) => {
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
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

  // При выборе таски из списка
  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId) // отметить активную таску
  }

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

      {activeSection === "list" &&
        TasksList.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            ref={(el) => {
              listTaskRefs.current[task.id] = el
            }}
            handleSelectTask={handleSelectTask}
          />
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
                <TaskItem
                  key={task.id}
                  task={task}
                  ref={(el) => {
                    mapTaskRefs.current[task.id] = el
                  }}
                  handleSelectTask={handleSelectTask}
                  handleClickTask={() => handleTaskClick(task.id)}
                  showButton={false}
                  showDescription={false}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <Modal isOpen={selectedTask !== null} onClose={handleCloseTask}>
        <TaskInfo selectedOrder={selectedTask as TaskType} />

        <TaskPrimaryButton onClick={() => {}} icon={penWhiteIcon} text={t("respondToTask")} />
      </Modal>
    </div>
  )
}

export default PerformerDiscover
