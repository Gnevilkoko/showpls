import { useState } from "react"
import Modal from "../../../shared/components/Modal"
import { useNotification } from "../../../shared/hooks/useNotification"
import { useAppSelector, useAppDispatch } from "../../../store"
import { updateUserPartial } from "../../../store/userSlice"
import { useTranslation } from "react-i18next"
import TaskPrimaryButton from "../../../shared/components/TaskPrimaryButton"
import penWhiteIcon from "../../../assets/icons/actions/pen-white.svg"
import userIcon from "../../../assets/icons/navigation/user.svg"
import { useUpdateProfileMutation } from "../../../store/api/userApi"
import { useUploadFileMutation } from "../../../store/api/uploadApi"

interface ModalEditProfileProps {
  isOpenEditProfile: boolean
  setIsOpenEditProfile: (isOpenEditProfile: boolean) => void
}

const ModalEditProfile = ({ isOpenEditProfile, setIsOpenEditProfile }: ModalEditProfileProps) => {
  const { t } = useTranslation()
  const notification = useNotification()
  const dispatch = useAppDispatch()
  const userData = useAppSelector((state) => state.user.userData)

  const [newAvatar, setNewAvatar] = useState<string>(userData?.avatar || "")
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [newName, setNewName] = useState<string>(
    `${userData?.firstName || ""}${userData?.lastName ? " " + userData.lastName : ""}`.trim()
  )
  const [newLocation, setNewLocation] = useState<string>(userData?.city || "")
  const [newAbout, setNewAbout] = useState<string>(userData?.about || "")

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [uploadFile, { isLoading: isUploading }] = useUploadFileMutation()

  const isSubmitting = isUpdating || isUploading

  const resetFormToUserData = () => {
    setNewAvatar(userData?.avatar || "")
    setNewAvatarFile(null)
    setNewName(
      `${userData?.firstName || ""}${userData?.lastName ? " " + userData.lastName : ""}`.trim()
    )
    setNewLocation(userData?.city || "")
    setNewAbout(userData?.about || "")
  }

  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewAvatar(URL.createObjectURL(file))
      setNewAvatarFile(file)
    }
    e.target.value = ""
  }

  const handleSaveChanges = async () => {
    try {
      const [firstName, ...rest] = newName.trim().split(/\s+/)
      const lastName = rest.join(" ") || null

      let avatarUrl: string | null = userData?.avatar ?? null
      if (newAvatarFile) {
        const result = await uploadFile(newAvatarFile).unwrap()
        avatarUrl = result.url
      }

      const updated = await updateProfile({
        firstName: firstName || userData?.firstName || "",
        lastName: lastName ?? null,
        city: newLocation || null,
        about: newAbout || null,
        ...(avatarUrl !== undefined && { avatar: avatarUrl }),
      }).unwrap()

      dispatch(
        updateUserPartial({
          firstName: updated.firstName,
          lastName: updated.lastName,
          city: updated.city,
          about: updated.about,
          avatar: updated.avatar,
        })
      )

      notification.showSuccess(t("profileUpdated"))
      setIsOpenEditProfile(false)
      resetFormToUserData()
    } catch (err) {
      notification.showError("somethingWentWrong")
    }
  }

  const handleCloseEditProfile = () => {
    setIsOpenEditProfile(false)
    resetFormToUserData()
  }

  return (
    <Modal isOpen={isOpenEditProfile} onClose={handleCloseEditProfile}>
      <h2 className="modal__header">{t("editProfile")}</h2>

      <label className="modal__avatar-container">
        <img src={newAvatar || userIcon} alt="Profile Avatar" className="modal__avatar" />
        <input type="file" accept="image/*" onChange={handleUploadAvatar} style={{ display: "none" }} />
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

      <TaskPrimaryButton
        color="green"
        icon={penWhiteIcon}
        text={t("saveChanges")}
        onClick={handleSaveChanges}
        disabled={isSubmitting}
      />
    </Modal>
  )
}

export default ModalEditProfile
