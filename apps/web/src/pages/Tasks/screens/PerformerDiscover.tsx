import { useTranslation } from "react-i18next"
import { TasksList } from "../tasks"
import { useRef, useState } from "react"
import type { TaskType } from "../../../shared/types"
import Modal from "../../../shared/components/Modal"
import TaskInfo from "../../../shared/components/TaskInfo"
import ToggleSectionButton from "../components/ToggleSectionButton"
import TaskItem from "../components/TaskItem"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"
import TasksMap from "../TasksMap"

const PerformerDiscover = () => {
  const { t } = useTranslation()

  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)

  // Создаём ref для каждой таски в списке и на карте
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleSelectTask = (task: TaskType) => {
    setSelectedTask(task)
  }

  const handleCloseTask = () => {
    setSelectedTask(null)
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
          <TasksMap
            selectedTask={selectedTask} // id активной таски
            handleSelectTask={handleSelectTask} // при клике на таску из списка
            tasksList={TasksList}
          />
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
