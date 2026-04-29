import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../../../store"
import type { RootState } from "../../../store"
import {
  useGetSpecialsManageQuery,
  useCreateSpecialMutation,
  useUpdateSpecialMutation,
  useDeleteSpecialMutation,
} from "../../../store/api/specialsApi"
import type { SpecialBackend } from "../../../shared/types/backend"
import type { CreateSpecialInput, UpdateSpecialInput } from "../../../store/api/specialsApi"
import Header from "../../../shared/components/Header"
import Navigation from "../../../shared/components/Navigation"
import Modal from "../../../shared/components/Modal"
import SpecialForm from "./SpecialForm"
import { useNotification } from "../../../shared/hooks/useNotification"

export default function SpecialsManage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const notification = useNotification()
  const userData = useAppSelector((state: RootState) => state.user.userData)
  const isAdmin = userData?.role === "admin"

  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const [editingSpecial, setEditingSpecial] = useState<SpecialBackend | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data, isLoading } = useGetSpecialsManageQuery(undefined, { skip: !isAdmin })
  const [createSpecial, { isLoading: isCreating }] = useCreateSpecialMutation()
  const [updateSpecial, { isLoading: isUpdating }] = useUpdateSpecialMutation()
  const [deleteSpecial, { isLoading: isDeleting }] = useDeleteSpecialMutation()

  useEffect(() => {
    if (userData && !isAdmin) {
      navigate("/home", { replace: true })
    }
  }, [userData, isAdmin, navigate])

  const specials = data?.items ?? []
  const isSubmitting = isCreating || isUpdating

  const handleCreate = () => {
    setEditingSpecial(null)
    setModalMode("create")
  }

  const handleEdit = (special: SpecialBackend) => {
    setEditingSpecial(special)
    setModalMode("edit")
  }

  const handleSubmit = async (values: CreateSpecialInput | UpdateSpecialInput) => {
    try {
      if (modalMode === "edit" && editingSpecial) {
        await updateSpecial({ id: editingSpecial.id, body: values }).unwrap()
        notification.showSuccess("specialUpdated")
      } else {
        await createSpecial(values as CreateSpecialInput).unwrap()
        notification.showSuccess("specialCreated")
      }
      setModalMode(null)
      setEditingSpecial(null)
    } catch (e) {
      notification.showError("somethingWentWrong")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteSpecial(deleteConfirmId).unwrap()
      notification.showSuccess("specialDeleted")
      setDeleteConfirmId(null)
    } catch (e) {
      notification.showError("somethingWentWrong")
    }
  }

  if (!userData) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="page admin-specials-page">
      <Header />

      <div className="admin-specials-page__content">
        <div className="admin-specials-page__header">
          <h1>{t("adminSpecials.title")}</h1>
          <button type="button" className="admin-specials-page__add-btn" onClick={handleCreate}>
            {t("adminSpecials.add")}
          </button>
        </div>

        {isLoading ? (
          <p>{t("loading")}</p>
        ) : specials.length === 0 ? (
          <p className="admin-specials-page__empty">{t("homePage.specials.empty")}</p>
        ) : (
          <ul className="admin-specials-list">
            {specials.map((special) => (
              <li key={special.id} className="admin-specials-list__item">
                <div
                  className="admin-specials-list__logo"
                  style={{ backgroundColor: special.partnerColor }}
                >
                  {special.partnerShort}
                </div>
                <div className="admin-specials-list__body">
                  <span className="admin-specials-list__name">{special.partnerName}</span>
                  <span className="admin-specials-list__title">
                    {special.title.ru || special.title.en}
                  </span>
                  <span className="admin-specials-list__reward">
                    {special.rewardAmount} {special.rewardCurrencyCode}
                  </span>
                </div>
                <div className="admin-specials-list__actions">
                  <button
                    type="button"
                    className="admin-specials-list__edit"
                    onClick={() => handleEdit(special)}
                  >
                    {t("adminSpecials.edit")}
                  </button>
                  <button
                    type="button"
                    className="admin-specials-list__delete"
                    onClick={() => setDeleteConfirmId(special.id)}
                    title={t("adminSpecials.delete")}
                  >
                    {t("adminSpecials.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Navigation />

      <Modal
        isOpen={modalMode !== null}
        onClose={() => {
          setModalMode(null)
          setEditingSpecial(null)
        }}
      >
        <SpecialForm
          initial={modalMode === "edit" ? editingSpecial : null}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalMode(null)
            setEditingSpecial(null)
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
      >
        <div className="admin-specials-delete-confirm">
          <p>{t("adminSpecials.confirmDelete")}</p>
          <div className="admin-specials-delete-confirm__actions">
            <button
              type="button"
              className="admin-specials-form__btn admin-specials-form__btn--cancel"
              onClick={() => setDeleteConfirmId(null)}
            >
              {t("adminSpecials.cancel")}
            </button>
            <button
              type="button"
              className="admin-specials-form__btn admin-specials-form__btn--delete"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "..." : t("adminSpecials.delete")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
