import { useTranslation } from "react-i18next"
import ChatMap from "./ChatMap"
import starsWhiteIcon from "../../../assets/icons/status/stars-white.svg"
import type { TaskType } from "../../../shared/types"
import ImageViewer from "../../../shared/components/ImageViewer"
import { useCallback, useState } from "react"

interface TaskInfoProps {
  selectedOrder: TaskType
}

const TaskInfo = ({ selectedOrder }: TaskInfoProps) => {
  const { t } = useTranslation()

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  const handleImageClick = useCallback(
    (imageSrc: string) => {
      if (!selectedOrder.attachments) return

      const index = selectedOrder.attachments.indexOf(imageSrc)
      setSelectedImageIndex(index)
    },
    [selectedOrder]
  )

  if (!selectedOrder) return null

  return (
    <>
      <div className="chat__task-info__wrapper">
        <div className="chat__task-info">
          <span className="chat__task-info__title">{selectedOrder.title}</span>
          <span className="chat__task-info__description">{selectedOrder.description}</span>
        </div>

        <div className="chat__task-tags">
          <div className="tag stars">
            {selectedOrder.price}
            <span>
              <img src={starsWhiteIcon} alt="Stars Icon" />
            </span>
          </div>

          {selectedOrder.tags.map((tag, index) => {
            if (tag.type === "hLeft") {
              return (
                <div key={index} className="tag">
                  {t("tasksPage.hLeft", { count: tag.count })}
                </div>
              )
            }
            return null
          })}
        </div>
      </div>

      {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
        <div className="task__attachments">
          {selectedOrder.attachments.map((img, idx) => (
            <div key={idx} className="preview-attachments" onClick={() => handleImageClick(img)}>
              <img src={img} alt={`attachments-${idx}`} />
            </div>
          ))}
        </div>
      )}

      {selectedOrder.position && <ChatMap coordinates={selectedOrder.position} />}

      {selectedImageIndex !== null && selectedOrder.attachments && (
        <ImageViewer
          images={selectedOrder.attachments}
          currentImageIndex={selectedImageIndex}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
    </>
  )
}

export default TaskInfo
