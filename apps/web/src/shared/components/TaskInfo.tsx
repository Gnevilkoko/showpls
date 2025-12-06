import type { TaskType } from "../types"
import { useCallback, useState } from "react"
import ChatMapGoogle from "./maps/google/ChatMapGoogle"
import ImageViewer from "./ImageViewer"
import TaskTags from "./TaskTags"
import { useSelector } from "react-redux"
import type { RootState } from "../../store"
import ChatMap2Gis from "./maps/2Gis/ChatMap2Gis"

interface TaskInfoProps {
  selectedOrder: TaskType
}

const TaskInfo = ({ selectedOrder }: TaskInfoProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const language = useSelector((state: RootState) => state.language)
  const isRussian = language === "ru"

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
      </div>

      <TaskTags task={selectedOrder} />

      {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
        <div className="task__attachments">
          {selectedOrder.attachments.map((img, idx) => (
            <div key={idx} className="preview-attachments" onClick={() => handleImageClick(img)}>
              <img src={img} alt={`attachments-${idx}`} />
            </div>
          ))}
        </div>
      )}

      {selectedOrder.position && isRussian ? (
        <ChatMap2Gis coordinates={selectedOrder.position} />
      ) : (
        <ChatMapGoogle coordinates={selectedOrder.position} />
      )}

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
