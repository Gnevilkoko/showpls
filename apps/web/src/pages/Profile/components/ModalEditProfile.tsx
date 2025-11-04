import { useState } from "react"
import Modal from "../../../shared/components/Modal"
import { useNotification } from "../../../shared/hooks/useNotification"
import { useAppSelector } from "../../../store"
import { useFileToBase64 } from "../../../shared/hooks/useFileToBase64"
import { useTranslation } from "react-i18next"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"
import userIcon from "../../../assets/icons/navigation/user.svg"

interface ModalEditProfileProps {
  isOpenEditProfile: boolean
  setIsOpenEditProfile: (isOpenEditProfile: boolean) => void
}

const ModalEditProfile = ({ isOpenEditProfile, setIsOpenEditProfile }: ModalEditProfileProps) => {
  const { t } = useTranslation()
  const notification = useNotification()
  const userData = useAppSelector((state) => state.user.userData)
  const [newAvatar, setNewAvatar] = useState<string>(userData?.avatar || "")
  // Сохраняем файл в state для отправки на бекенд
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const { convertToBase64 } = useFileToBase64()
  const [newName, setNewName] = useState<string>(
    `${userData?.firstName || ""}${userData?.lastName ? " " + userData.lastName : ""}`
  )
  const [newLocation, setNewLocation] = useState<string>(userData?.city || "")
  const [newAbout, setNewAbout] = useState<string>(userData?.about || "")

  const handleClearNewData = () => {
    setTimeout(() => {
      setNewAvatar(userData?.avatar || "")
      setNewName(`${userData?.firstName || ""}${userData?.lastName ? " " + userData.lastName : ""}`)
      setNewLocation(userData?.city || "")
      setNewAbout(userData?.about || "")
    }, 300)
  }

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setNewAvatar(url)

      setNewAvatarFile(file)
    }
    e.target.value = ""
  }

  const handleSaveChanges = async () => {
    notification.showSuccess(t("profileUpdated"))
    setIsOpenEditProfile(false)
    handleClearNewData()

    // перед отправкой на бекенд конвертируем файл в base64
    let base64 = ""
    if (newAvatarFile) {
      base64 = await convertToBase64(newAvatarFile)
    }

    console.log("base64", base64)
    console.log("newName", newName)
    console.log("newLocation", newLocation)
    console.log("newAbout", newAbout)
  }

  const handleCloseEditProfile = () => {
    setIsOpenEditProfile(false)
    handleClearNewData()
  }

  return (
    <Modal isOpen={isOpenEditProfile} onClose={handleCloseEditProfile}>
      <h2 className="modal__header">{t("editProfile")}</h2>

      <label className="modal__avatar-container">
        <img src={newAvatar || userIcon} alt="Profile Avatar" className="modal__avatar" />
        <input type="file" accept="image/*" multiple onChange={handleUploadAvatar} style={{ display: "none" }} />
      </label>

      <div className="modal__input-container">
        <span>{t("name")}</span>

        <input
          type="text"
          placeholder={t("enterYourName")}
          className="input-profile"
          maxLength={30}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
      </div>

      <div className="modal__input-container">
        <span>{t("geolocation")}</span>

        <input
          type="text"
          placeholder={t("enterYourCity")}
          className="input-profile"
          maxLength={30}
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
        />
      </div>

      <div className="modal__input-container">
        <span>{t("aboutMe")}</span>

        <input
          type="text"
          placeholder={t("enterYourAbout")}
          className="input-profile"
          maxLength={50}
          value={newAbout}
          onChange={(e) => setNewAbout(e.target.value)}
        />
      </div>

      <TaskPrimaryButton icon={penWhiteIcon} text={t("saveChanges")} onClick={handleSaveChanges} />
    </Modal>
  )
}

export default ModalEditProfile
