import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import type { TaskType } from "../../../shared/types"
import { NotificationHandler } from "../../../shared/utils/notificationHandler"
import linkIcon from "../../../assets/icons/ui/link.svg"

export function getTaskShareUrl(task: TaskType): string {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/tasks?requestId=${encodeURIComponent(task.id)}`
}

interface ShareTaskButtonProps {
  task: TaskType
  className?: string
}

/**
 * Кнопка «Поделиться ссылкой на задачу».
 * На поддерживаемых устройствах открывает нативный шаринг (соцсети, мессенджеры),
 * иначе копирует ссылку в буфер обмена.
 */
const ShareTaskButton = ({ task, className = "" }: ShareTaskButtonProps) => {
  const { t } = useTranslation()

  const handleShare = useCallback(async () => {
    const url = getTaskShareUrl(task)
    const title = task.title || t("tasksPage.shareTaskTitle")
    const text = task.description?.slice(0, 200) ?? ""

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
        NotificationHandler.showSuccessTranslated("linkCopied")
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await copyToClipboard(url)
        }
      }
    } else {
      await copyToClipboard(url)
    }
  }, [task, t])

  async function copyToClipboard(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url)
      NotificationHandler.showSuccessTranslated("linkCopied")
    } catch {
      NotificationHandler.showErrorTranslated("somethingWentWrong")
    }
  }

  return (
    <button
      type="button"
      className={`share-task-btn ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleShare()
      }}
      title={t("tasksPage.shareTask")}
      aria-label={t("tasksPage.shareTask")}
    >
      <img src={linkIcon} alt="" />
    </button>
  )
}

export default ShareTaskButton
