import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Modal from "../../../shared/components/Modal"

type ModalProfileNotificationsProps = {
  isOpen: boolean
  onClose: () => void
  unreadCount: number
}

const ModalProfileNotifications = ({ isOpen, onClose, unreadCount }: ModalProfileNotificationsProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="modal__header">{t("notifications")}</h2>
      <p className="profile-notifications-modal__text">
        {t("profileScreens.notificationsBody", { count: unreadCount })}
      </p>
      <button
        type="button"
        className="profile-notifications-modal__cta"
        onClick={() => {
          onClose()
          navigate("/chats")
        }}
      >
        {t("profileScreens.openChats")}
      </button>
    </Modal>
  )
}

export default ModalProfileNotifications
