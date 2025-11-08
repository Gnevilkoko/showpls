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
import loupeWhiteIcon from "../../../assets/icons/ui/loupe-white.svg"
import closeIcon from "../../../assets/icons/ui/close-icon.svg"
import TasksMap from "../TasksMap"
import PerformersMap from "../PerformersMap"

const PerformerDiscover = () => {
  const userId = 100
  const { t } = useTranslation()

  const [activeSection, setActiveSection] = useState<"list" | "map">("list")
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false)

  const [isOpenPerformerDiscover, setIsOpenPerformerDiscover] = useState(false)

  const handleOpenPerformerDiscover = () => {
    setIsOpenModal(false)
    setIsOpenPerformerDiscover(true)
  }

  const handleClosePerformerDiscover = () => {
    setIsOpenModal(true)
    setIsOpenPerformerDiscover(false)
  }

  // Создаём ref для каждой таски в списке и на карте
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleSelectTask = (task: TaskType) => {
    setSelectedTask(task)
    setIsOpenModal(true)
  }

  const handleCloseTask = () => {
    setIsOpenModal(false)
    setTimeout(() => {
      setSelectedTask(null)
    }, 300)
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

      <Modal isOpen={isOpenModal} onClose={handleCloseTask}>
        <TaskInfo selectedOrder={selectedTask as TaskType} />

        {selectedTask?.customer_id === userId ? (
          <>
            <TaskPrimaryButton color="green" onClick={() => {}} icon={penWhiteIcon} text={t("editToTask")} />

            <TaskPrimaryButton
              color="blue"
              onClick={handleOpenPerformerDiscover}
              icon={loupeWhiteIcon}
              text={t("performerDiscovery")}
            />

            <TaskPrimaryButton color="none" onClick={() => {}} icon={closeIcon} text={t("deleteTask")} />
          </>
        ) : (
          <TaskPrimaryButton color="green" onClick={() => {}} icon={penWhiteIcon} text={t("sendTheOrder")} />
        )}
      </Modal>

      <Modal isOpen={isOpenPerformerDiscover} onClose={handleClosePerformerDiscover}>
        <PerformersMap />
      </Modal>
    </div>
  )
}

export default PerformerDiscover
