import { forwardRef } from "react"
import { useTranslation } from "react-i18next"
import type { TaskType } from "../../../shared/types"
import TaskTags from "../../../shared/components/TaskTags"
import ShareTaskButton from "./ShareTaskButton"

interface TaskItemProps {
  task: TaskType
  handleSelectTask: (task: TaskType) => void
  handleClickTask?: () => void
  showButton?: boolean
  showDescription?: boolean
  showShareButton?: boolean
}

const TaskItem = forwardRef<HTMLDivElement, TaskItemProps>(
  (
    { task, handleSelectTask, handleClickTask, showButton = true, showDescription = true, showShareButton = true },
    ref
  ) => {
    const { t } = useTranslation()

    return (
      <div ref={ref} className="tasks__task" onClick={handleClickTask}>
        <span className="task__header">{task.title}</span>

        <div className="task__container">
          <div className="task__content">
            <div className="task__tags-row">
              <TaskTags task={task} />
              {showShareButton && <ShareTaskButton task={task} />}
            </div>

            {showDescription && <span>{task.description}</span>}
          </div>

          {showButton && (
            <button className="task__button" onClick={() => handleSelectTask(task)}>
              {t("tasksPage.viewDetails")}
            </button>
          )}
        </div>
      </div>
    )
  }
)

TaskItem.displayName = "TaskItem"

export default TaskItem
