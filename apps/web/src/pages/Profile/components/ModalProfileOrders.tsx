import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Modal from "../../../shared/components/Modal"
import { useGetRequestListQuery } from "../../../store/api/requestApi"
import { adaptRequestToTask } from "../../../shared/types/adapters"
import TaskInfo from "../../../shared/components/TaskInfo"
import checkMarkWhiteIcon from "../../../assets/icons/status/check-mark-white.svg"
import lockKeyholeWhiteIcon from "../../../assets/icons/status/lock-keyhole-white.svg"
import starsIcon from "../../../assets/icons/status/stars.svg"
import arrowLeftIcon from "../../../assets/icons/ui/arrow-left.svg"
import type { RequestStatus } from "../../../shared/types/backend"
import type { TaskType } from "../../../shared/types"
import GoogleMapProvider from "../../../shared/providers/GoogleMapProvider"

type Mode = "customer" | "performer"

interface ModalProfileOrdersProps {
  isOpen: boolean
  onClose: () => void
  mode: Mode
}

const CUSTOMER_ACTIVE: RequestStatus[] = ["published", "accepted", "in_progress", "arbitration"]
const CUSTOMER_PAST: RequestStatus[] = ["completed", "cancelled"]
const PERFORMER_ACTIVE: RequestStatus[] = ["accepted", "in_progress", "arbitration"]
const PERFORMER_DONE: RequestStatus[] = ["completed"]

const STATUS_LABEL_KEY: Partial<Record<RequestStatus, string>> = {
  draft: "taskStatusDraft",
  published: "taskStatusPublished",
  accepted: "taskStatusAccepted",
  in_progress: "taskStatusInProgress",
  completed: "taskStatusCompleted",
  cancelled: "taskStatusCancelled",
  arbitration: "taskStatusArbitration",
}

function formatCompactDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })
  } catch {
    return ""
  }
}

function getStatusVisual(status: RequestStatus | undefined): { color: "green" | "gold"; icon: string } {
  if (!status) return { color: "gold", icon: lockKeyholeWhiteIcon }
  if (status === "completed") return { color: "green", icon: checkMarkWhiteIcon }
  if (status === "cancelled") return { color: "gold", icon: lockKeyholeWhiteIcon }
  if (status === "accepted" || status === "in_progress") return { color: "green", icon: checkMarkWhiteIcon }
  return { color: "gold", icon: lockKeyholeWhiteIcon }
}

const ModalProfileOrders = ({ isOpen, onClose, mode }: ModalProfileOrdersProps) => {
  const { t } = useTranslation()
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null)
  const [tab, setTab] = useState<"active" | "secondary">("active")
  const [offset, setOffset] = useState(0)
  const [accumulated, setAccumulated] = useState<TaskType[]>([])
  const limit = 20

  const { data, isLoading, isError, isFetching, refetch, isUninitialized } = useGetRequestListQuery(
    {
      myTasks: mode,
      limit,
      offset,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    { skip: !isOpen, refetchOnMountOrArgChange: true }
  )

  useEffect(() => {
    if (!isOpen) return
    setSelectedTask(null)
    setTab("active")
    setOffset(0)
    setAccumulated([])
    // RTK Query can occasionally leave a "pending" subscription edge-case when toggling `skip`
    // quickly while resetting args. Force a fresh fetch on every open.
    void refetch()
  }, [isOpen, mode, refetch])

  useEffect(() => {
    if (!data?.items) return
    setAccumulated((prev) => {
      const byId = new Map<string, TaskType>()
      prev.forEach((t) => byId.set(String(t.id), t))
      data.items.forEach((r) => byId.set(String(r.id), adaptRequestToTask(r)))
      return Array.from(byId.values())
    })
  }, [data?.items])

  const statusSets = useMemo(() => {
    return {
      active: new Set<RequestStatus>(mode === "customer" ? CUSTOMER_ACTIVE : PERFORMER_ACTIVE),
      secondary: new Set<RequestStatus>(mode === "customer" ? CUSTOMER_PAST : PERFORMER_DONE),
    }
  }, [mode])

  const filtered = useMemo(() => {
    const set = tab === "active" ? statusSets.active : statusSets.secondary
    return accumulated
      .filter((t) => set.has(t.status))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [accumulated, statusSets, tab])

  const secondaryTitle = mode === "customer" ? t("profileOrders.past") : t("profileOrders.completed")
  const serverTotal = data?.total
  const hasMoreToFetch = typeof serverTotal === "number" && accumulated.length < serverTotal
  const showLoadMore = !isError && filtered.length > 0 && hasMoreToFetch
  const listLoading = isOpen && (isLoading || isFetching || isUninitialized)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="transaction-container">
        <div className="profile-subpage__header" style={{ marginBottom: "12px" }}>
          {selectedTask ? (
            <button type="button" className="profile-subpage__back" onClick={() => setSelectedTask(null)}>
              <img src={arrowLeftIcon} alt="Back" />
            </button>
          ) : (
            <span style={{ width: "44px", height: "44px" }} />
          )}
          <h2>{t("myOrders")}</h2>
        </div>

        {selectedTask ? (
          <GoogleMapProvider>
            <TaskInfo selectedOrder={selectedTask} />
          </GoogleMapProvider>
        ) : (
          <>
            <div className="toggle-profile-mode" role="tablist" aria-label={t("myOrders")}>
              <button
                type="button"
                className={`prof-mode__toggle ${tab === "active" ? "active green" : ""}`}
                onClick={() => setTab("active")}
              >
                {t("profileOrders.active")}
              </button>
              <button
                type="button"
                className={`prof-mode__toggle ${tab === "secondary" ? "active blue" : ""}`}
                onClick={() => setTab("secondary")}
              >
                {secondaryTitle}
              </button>
            </div>

            {listLoading ? (
              <div className="empty-state" style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
                <p>{t("loading")}</p>
              </div>
            ) : null}
            {isError ? (
              <div className="empty-state" style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
                <p>{t("somethingWentWrong")}</p>
                <button type="button" className="customer__btn blue" style={{ marginTop: "10px" }} onClick={() => void refetch()}>
                  {t("retry")}
                </button>
              </div>
            ) : null}

            {!listLoading && !isError ? (
              <>
                {filtered.length === 0 ? (
                  <div className="empty-state" style={{ textAlign: "center", marginTop: "20px", color: "var(--text-secondary)" }}>
                    <p>{tab === "active" ? t("profileOrders.emptyActive") : t("profileOrders.emptySecondary")}</p>
                  </div>
                ) : (
                  <>
                    {filtered.map((task) => {
                      const visual = getStatusVisual(task.status)
                      return (
                        <div
                          key={task.id}
                          className="transaction_item profile-orders__menu-item"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedTask(task)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedTask(task)
                          }}
                        >
                          <div className={`trans-status-icon ${visual.color}`}>
                            <img src={visual.icon} alt="Status" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div className="chat__task-status-badge" style={{ opacity: 1 }}>
                              <div className="chat__task-status-label">
                                {task.status && STATUS_LABEL_KEY[task.status] ? t(STATUS_LABEL_KEY[task.status]!) : ""}
                              </div>
                            </div>
                            <div className="chat__task-info__title" style={{ marginTop: "-2px" }}>
                              {task.title}
                            </div>
                            <div className="transaction_item-content" style={{ fontSize: "16px" }}>
                              <span>{Number(task.price || 0)}</span>
                              <img src={starsIcon} alt="Stars" />
                            </div>
                          </div>
                          <div className="trans-date">{formatCompactDate(task.createdAt)}</div>
                        </div>
                      )
                    })}
                  </>
                )}

                {showLoadMore ? (
                  <button
                    type="button"
                    className="customer__btn blue"
                    style={{ marginTop: "10px" }}
                    onClick={() => setOffset((v) => v + limit)}
                    disabled={isFetching}
                  >
                    <span>{isFetching ? `${t("loading")}…` : t("homePage.loadMore")}</span>
                  </button>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  )
}

export default ModalProfileOrders

