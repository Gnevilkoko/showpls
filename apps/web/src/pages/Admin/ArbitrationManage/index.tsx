import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Header from "../../../shared/components/Header"
import Navigation from "../../../shared/components/Navigation"
import { useNotification } from "../../../shared/hooks/useNotification"
import { useAppSelector } from "../../../store"
import type { RootState } from "../../../store"
import {
  type ArbitrationAction,
  type ArbitrationStatus,
  useGetArbitrationListQuery,
  useResolveArbitrationMutation,
} from "../../../store/api/arbitrationApi"
import { useJoinAsAdminMutation } from "../../../store/api/chatApi"

export default function ArbitrationManage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const notification = useNotification()
  const userData = useAppSelector((state: RootState) => state.user.userData)
  const isAdmin = userData?.role === "admin"

  const [statusFilter, setStatusFilter] = useState<ArbitrationStatus | "all">("pending")
  const [adminCommentById, setAdminCommentById] = useState<Record<string, string>>({})
  const [actionById, setActionById] = useState<Record<string, ArbitrationAction>>({})

  const { data, isLoading, refetch } = useGetArbitrationListQuery(
    statusFilter === "all" ? {} : { status: statusFilter, limit: 100, offset: 0 },
    { skip: !isAdmin }
  )
  const [joinAsAdmin, { isLoading: isJoining }] = useJoinAsAdminMutation()
  const [resolveArbitration, { isLoading: isResolving }] = useResolveArbitrationMutation()

  useEffect(() => {
    if (userData && !isAdmin) navigate("/home", { replace: true })
  }, [userData, isAdmin, navigate])

  const items = useMemo(() => data?.items ?? [], [data?.items])

  const handleOpenChatAsSupport = async (chatId: string) => {
    try {
      await joinAsAdmin(chatId).unwrap()
      navigate(`/chat/${chatId}`)
    } catch {
      notification.showError("somethingWentWrong")
    }
  }

  const handleResolve = async (arbitrationId: string) => {
    const action = actionById[arbitrationId] ?? "reject"
    try {
      await resolveArbitration({
        arbitrationId,
        body: {
          action,
          message: adminCommentById[arbitrationId]?.trim() || undefined,
        },
      }).unwrap()
      notification.showSuccess("operationCompleted")
      refetch()
    } catch {
      notification.showError("somethingWentWrong")
    }
  }

  if (!userData || !isAdmin) return null

  return (
    <div className="page admin-arbitration-page">
      <Header />
      <div className="admin-arbitration-page__content">
        <div className="admin-arbitration-page__header">
          <h1>{t("adminArbitration.title")}</h1>
          <div className="admin-arbitration-page__filters">
            <button
              type="button"
              className={`admin-arbitration-page__filter-btn ${statusFilter === "pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("pending")}
            >
              {t("adminArbitration.pending")}
            </button>
            <button
              type="button"
              className={`admin-arbitration-page__filter-btn ${statusFilter === "resolved" ? "active" : ""}`}
              onClick={() => setStatusFilter("resolved")}
            >
              {t("adminArbitration.resolved")}
            </button>
            <button
              type="button"
              className={`admin-arbitration-page__filter-btn ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              {t("adminArbitration.all")}
            </button>
          </div>
        </div>

        {isLoading ? (
          <p>{t("loading")}</p>
        ) : items.length === 0 ? (
          <p className="admin-arbitration-page__empty">{t("adminArbitration.empty")}</p>
        ) : (
          <ul className="admin-arbitration-list">
            {items.map((item) => {
              const selectedAction = actionById[item.id] ?? "reject"
              return (
                <li key={item.id} className="admin-arbitration-list__item">
                  <div className="admin-arbitration-list__meta">
                    <span className="admin-arbitration-list__title">{item.request.title}</span>
                    <span className="admin-arbitration-list__status">{item.status}</span>
                  </div>
                  <p className="admin-arbitration-list__reason">{item.reason}</p>
                  <div className="admin-arbitration-list__actions">
                    <button
                      type="button"
                      className="admin-arbitration-list__chat-btn"
                      onClick={() => handleOpenChatAsSupport(item.chat.id)}
                      disabled={isJoining}
                    >
                      {t("adminArbitration.openChatAsSupport")}
                    </button>
                    <select
                      className="admin-arbitration-list__select"
                      value={selectedAction}
                      onChange={(e) =>
                        setActionById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value as ArbitrationAction,
                        }))
                      }
                    >
                      <option value="approve_cancel">{t("adminArbitration.approveCancel")}</option>
                      <option value="complete">{t("adminArbitration.completeOrder")}</option>
                      <option value="reject">{t("adminArbitration.rejectArbitration")}</option>
                    </select>
                    <textarea
                      className="admin-arbitration-list__textarea"
                      placeholder={t("adminArbitration.adminComment")}
                      value={adminCommentById[item.id] ?? ""}
                      onChange={(e) =>
                        setAdminCommentById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="admin-arbitration-list__resolve-btn"
                      onClick={() => handleResolve(item.id)}
                      disabled={isResolving}
                    >
                      {t("adminArbitration.resolve")}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <Navigation />
    </div>
  )
}
