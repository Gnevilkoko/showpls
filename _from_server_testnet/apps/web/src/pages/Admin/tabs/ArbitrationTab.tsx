import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
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

export default function ArbitrationTab() {
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

  return (
    <>
      <div className="admin-arbitration__filters">
        {(["pending", "resolved", "all"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`admin-panel__filter-btn ${statusFilter === s ? "admin-panel__filter-btn--active" : ""}`}
            onClick={() => setStatusFilter(s)}
          >
            {s === "all" ? t("adminArbitration.all") : t(`adminArbitration.${s}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="admin-panel__loading">{t("loading")}</p>
      ) : items.length === 0 ? (
        <p className="admin-panel__empty">{t("adminArbitration.empty")}</p>
      ) : (
        <ul className="admin-arbitration-list">
          {items.map((item) => {
            const selectedAction = actionById[item.id] ?? "reject"
            return (
              <li key={item.id} className="admin-arbitration-list__item">
                <div className="admin-arbitration-list__top">
                  <div className="admin-arbitration-list__meta">
                    <span className="admin-arbitration-list__title">{item.request.title}</span>
                    <span className={`admin-arbitration-list__status admin-arbitration-list__status--${item.status}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="admin-arbitration-list__users">
                    <span>{t("adminArbitration.customer")}: {item.request.customer.firstName} {item.request.customer.lastName || ""}</span>
                    <span>{t("adminArbitration.initiator")}: {item.initiator.firstName} {item.initiator.lastName || ""}</span>
                  </div>
                  <p className="admin-arbitration-list__reason">
                    <strong>{t("adminArbitration.reason")}:</strong> {item.reason}
                  </p>
                  {item.adminMessage && (
                    <p className="admin-arbitration-list__admin-msg">
                      <strong>{t("adminArbitration.adminComment")}:</strong> {item.adminMessage}
                    </p>
                  )}
                </div>

                <div className="admin-arbitration-list__actions">
                  <button
                    type="button"
                    className="admin-panel__btn admin-panel__btn--primary"
                    onClick={() => handleOpenChatAsSupport(item.chat.id)}
                    disabled={isJoining}
                  >
                    {t("adminArbitration.openChatAsSupport")}
                  </button>

                  {item.status === "pending" && (
                    <div className="admin-arbitration-list__resolve-form">
                      <select
                        className="admin-panel__select"
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
                        className="admin-panel__textarea"
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
                        className="admin-panel__btn admin-panel__btn--resolve"
                        onClick={() => handleResolve(item.id)}
                        disabled={isResolving}
                      >
                        {t("adminArbitration.resolve")}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
