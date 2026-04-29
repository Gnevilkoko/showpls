import { useGetRequestQuery } from "../../store/api/requestApi"
import { useGetSubmissionByRequestQuery } from "../../store/api/submissionApi"
import type { SubmissionBackend } from "../types/backend"

/**
 * Единый источник правды по состоянию сдачи для одной задачи (requestId).
 * Используется в Chat и в NotificationMessage, чтобы кнопки «Принять»/«Запросить новое фото»
 * и «Сдать работу» показывались/скрывались одинаково и не дублировались после перезагрузки.
 */
export function useSubmissionState(requestId: string | null) {
  const requestIdStr = requestId != null ? String(requestId) : ""
  const skip = !requestIdStr

  const { data: requestData } = useGetRequestQuery(requestIdStr, { skip })
  const { data: submissionByRequest } = useGetSubmissionByRequestQuery(requestIdStr, {
    skip,
    refetchOnMountOrArgChange: true,
  })

  const effectiveSubmission: SubmissionBackend | undefined =
    submissionByRequest ?? requestData?.submission

  const requestCompleted = requestData?.status === "completed" || requestData?.status === "cancelled"
  const submissionPendingDecision =
    !requestCompleted && effectiveSubmission != null && effectiveSubmission.status === "submitted"

  return {
    requestData,
    submissionByRequest,
    effectiveSubmission,
    submissionPendingDecision,
  }
}
