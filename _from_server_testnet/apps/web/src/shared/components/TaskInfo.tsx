import type { TaskType } from "../types"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import ChatMapGoogle from "./maps/google/ChatMapGoogle"
import ImageViewer from "./ImageViewer"
import TaskTags from "./TaskTags"
import type { RequestStatus } from "../types/backend"
import type { SubmissionStatus } from "../types/backend"

const STATUS_KEYS: Record<RequestStatus, string> = {
  draft: "taskStatusDraft",
  published: "taskStatusPublished",
  accepted: "taskStatusAccepted",
  in_progress: "taskStatusInProgress",
  completed: "taskStatusCompleted",
  cancelled: "taskStatusCancelled",
  arbitration: "taskStatusArbitration",
}

const SUBMISSION_KEYS: Record<SubmissionStatus, string> = {
  pending: "submissionSubmitted",
  submitted: "submissionSubmitted",
  accepted: "submissionAccepted",
  rejected: "submissionRejected",
}

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|avi)$/i.test(url)

interface TaskInfoProps {
  selectedOrder: TaskType
}

const TaskInfo = ({ selectedOrder }: TaskInfoProps) => {
  const { t } = useTranslation()
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [selectedSubmissionImageIndex, setSelectedSubmissionImageIndex] = useState<number | null>(null)
  const statusKey = selectedOrder.status ? STATUS_KEYS[selectedOrder.status] : null
  const submission = selectedOrder.submission ?? null
  const submissionAttachmentUrls: string[] =
    submission?.attachments
      ?.map((a) => (typeof a === "string" ? a : (a as { url?: string }).url))
      ?.filter((u): u is string => Boolean(u)) ?? []
  const submissionImageUrls = submissionAttachmentUrls.filter((url) => !isVideoUrl(url))

  const handleImageClick = useCallback(
    (imageSrc: string) => {
      if (!selectedOrder.attachments) return
      const index = selectedOrder.attachments.indexOf(imageSrc)
      setSelectedImageIndex(index)
    },
    [selectedOrder]
  )

  const handleSubmissionImageClick = useCallback((index: number) => {
    setSelectedSubmissionImageIndex(index)
  }, [])

  if (!selectedOrder) return null

  return (
    <>
      <div className="chat__task-info__wrapper">
        {statusKey && (
          <div className="chat__task-status-badge">
            <span className="chat__task-status-label">{t(statusKey)}</span>
          </div>
        )}
        {submission && (
          <div className="chat__task-submission-hint">
            {t(SUBMISSION_KEYS[submission.status])}
            {submission.createdAt && (
              <span className="chat__task-submission-date">
                {" · "}
                {new Date(submission.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        )}
        <div className="chat__task-info">
          <span className="chat__task-info__title">{selectedOrder.title}</span>
          <span className="chat__task-info__description">{selectedOrder.description}</span>
        </div>
      </div>

      <TaskTags task={selectedOrder} />

      {submissionAttachmentUrls.length > 0 && (
        <div className="task__submitted-work">
          <span className="task__submitted-work__title">{t("submittedWorkTitle")}</span>
          <div className="task__attachments task__attachments--submission">
            {submissionAttachmentUrls.map((url, idx) =>
              isVideoUrl(url) ? (
                <div key={`sub-${idx}`} className="preview-attachments preview-attachments--submission">
                  <video src={url} controls playsInline muted />
                </div>
              ) : (
                <div
                  key={`sub-${idx}`}
                  className="preview-attachments preview-attachments--submission"
                  onClick={() => handleSubmissionImageClick(submissionImageUrls.indexOf(url))}
                >
                  <img
                    src={url}
                    alt={`submission-${idx}`}
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = "none"
                      const placeholder = target.nextElementSibling
                      if (placeholder) (placeholder as HTMLElement).style.display = "flex"
                    }}
                  />
                  <div className="preview-attachments__placeholder" aria-hidden>
                    📷
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {selectedOrder.attachments && selectedOrder.attachments.length > 0 && (
        <div className="task__attachments">
          {selectedOrder.attachments.map((img, idx) => (
            <div key={idx} className="preview-attachments" onClick={() => handleImageClick(img)}>
              <img src={img} alt={`attachments-${idx}`} />
            </div>
          ))}
        </div>
      )}

      {selectedOrder.position ? <ChatMapGoogle coordinates={selectedOrder.position} /> : null}

      {selectedSubmissionImageIndex !== null && submissionImageUrls.length > 0 && (
        <ImageViewer
          images={submissionImageUrls}
          currentImageIndex={selectedSubmissionImageIndex}
          onClose={() => setSelectedSubmissionImageIndex(null)}
        />
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
