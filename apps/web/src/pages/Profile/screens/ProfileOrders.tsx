import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import ProfileSubPage from "../components/ProfileSubPage"
import { useGetRequestListQuery } from "../../../store/api/requestApi"
import { adaptRequestToTask } from "../../../shared/types/adapters"
import TaskItem from "../../Tasks/components/TaskItem"
import type { RequestStatus } from "../../../shared/types/backend"

type Mode = "customer" | "performer"

function getModeFromLocationState(state: unknown): Mode {
  const mode = (state as { mode?: unknown } | null)?.mode
  return mode === "customer" || mode === "performer" ? mode : "customer"
}

const CUSTOMER_ACTIVE: RequestStatus[] = ["published", "accepted", "in_progress", "arbitration"]
const CUSTOMER_PAST: RequestStatus[] = ["completed", "cancelled"]
const PERFORMER_ACTIVE: RequestStatus[] = ["accepted", "in_progress", "arbitration"]
const PERFORMER_DONE: RequestStatus[] = ["completed"]

const ProfileOrders = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const mode: Mode = getModeFromLocationState(location.state)

  const { data, isLoading, isError } = useGetRequestListQuery({
    myTasks: mode,
    limit: 100,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  })

  const grouped = useMemo(() => {
    const items = data?.items ?? []
    const activeSet = new Set<RequestStatus>(mode === "customer" ? CUSTOMER_ACTIVE : PERFORMER_ACTIVE)
    const secondarySet = new Set<RequestStatus>(mode === "customer" ? CUSTOMER_PAST : PERFORMER_DONE)

    const active = items.filter((r) => activeSet.has(r.status))
    const secondary = items.filter((r) => secondarySet.has(r.status))

    return {
      active: active.map((r) => adaptRequestToTask(r)),
      secondary: secondary.map((r) => adaptRequestToTask(r)),
    }
  }, [data?.items, mode])

  const secondaryTitle = mode === "customer" ? t("profileOrders.past") : t("profileOrders.completed")

  return (
    <ProfileSubPage title={t("myOrders")}>
      {isLoading ? <div className="profile-orders__state">{t("loading")}</div> : null}
      {isError ? <div className="profile-orders__state">{t("somethingWentWrong")}</div> : null}

      {!isLoading && !isError ? (
        <div className="profile-orders">
          <section className="profile-orders__section">
            <h2 className="profile-orders__title">{t("profileOrders.active")}</h2>
            {grouped.active.length === 0 ? (
              <div className="profile-orders__empty">{t("profileOrders.emptyActive")}</div>
            ) : (
              grouped.active.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  showDescription={false}
                  handleSelectTask={() => navigate(`/tasks?requestId=${encodeURIComponent(task.id)}`)}
                />
              ))
            )}
          </section>

          <section className="profile-orders__section">
            <h2 className="profile-orders__title">{secondaryTitle}</h2>
            {grouped.secondary.length === 0 ? (
              <div className="profile-orders__empty">{t("profileOrders.emptySecondary")}</div>
            ) : (
              grouped.secondary.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  showDescription={false}
                  handleSelectTask={() => navigate(`/tasks?requestId=${encodeURIComponent(task.id)}`)}
                />
              ))
            )}
          </section>
        </div>
      ) : null}
    </ProfileSubPage>
  )
}

export default ProfileOrders

