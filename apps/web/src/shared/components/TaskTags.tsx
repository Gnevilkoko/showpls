import { useTranslation } from "react-i18next"
import type { TaskType } from "../types"
import starsWhiteIcon from "../../assets/icons/status/stars-white.svg"

interface TaskTagsProps {
  task: TaskType
}

const TaskTags = ({ task }: TaskTagsProps) => {
  const { t } = useTranslation()

  return (
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
  )
}

export default TaskTags
