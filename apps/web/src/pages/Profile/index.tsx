import profileBg from "../../assets/images/profile-bg.webp"
import profileBgDark from "../../assets/images/profile-bg-dark.webp"
import userIcon from "../../assets/icons/navigation/user.svg"
import locationGreenIcon from "../../assets/icons/ui/location-green.svg"
import statsStarWhiteIcon from "../../assets/icons/status/stats-star-white.svg"
import penIcon from "../../assets/icons/actions/pen.svg"
import forwardIcon from "../../assets/icons/ui/forward.svg"
import likeTagIcon from "../../assets/icons/ui/like-tag.svg"
import notificationIcon from "../../assets/icons/status/notification.svg"
import globalLangIcon from "../../assets/icons/ui/global-lang.svg"
import { useState } from "react"
import MiniWallet from "../../shared/components/MiniWallet"
import ToggleProfileMode from "../../shared/components/ToggleProfileMode"
import { useAppDispatch, useAppSelector } from "../../store"
import { useTranslation } from "react-i18next"
import { AVAILABLE_LANGUAGES } from "../../store/languageSlice"
import { useUpdateLanguageMutation } from "../../store/api/userApi"
import Navigation from "../../shared/components/Navigation"
import ProfileBtnItem from "./components/ProfileBtnItem"
import { AVAILABLE_THEMES } from "../../constants"
import themeIcon from "../../assets/icons/ui/theme.svg"
import ModalEditProfile from "./components/ModalEditProfile"
import ModalReviews from "./components/ModalReviews"
import { setTheme, type Theme } from "../../store/themeSlice"
import Modal from "../../shared/components/Modal"
import TransactionsList from "../Wallet/components/TransactionsList"
import { useSelector } from "react-redux"
import type { RootState } from "../../store"

const Profile = () => {
  const { t } = useTranslation()
  const theme: Theme = useSelector((state: RootState) => state.theme)
  const dispatch = useAppDispatch()
  const [updateLanguage] = useUpdateLanguageMutation()

  const [isOpenEditProfile, setIsOpenEditProfile] = useState<boolean>(false)
  const [isOpenReviews, setIsOpenReviews] = useState<boolean>(false)
  const [isOpenNotifications, setIsOpenNotifications] = useState<boolean>(false)

  const selectedLang = useAppSelector((state) => state.language)
  const selectedTheme = useAppSelector((state) => state.theme)

  const userData = useAppSelector((state) => state.user.userData)

  const [isReady, setIsReady] = useState(false)
  const [isOpenLang, setIsOpenLang] = useState<boolean>(false)
  const [isOpenTheme, setIsOpenTheme] = useState<boolean>(false)

  const [activeMode, setActiveMode] = useState<"customer" | "performer">("performer")

  const handleSelectDropdownLang = async (lng: string) => {
    try {
      // Отправляем запрос на бекенд
      await updateLanguage({ language: lng as "en" | "ru" }).unwrap()
    } catch (error) {
      console.warn("Failed to update language on backend:", error)
    }

    // В любом случае обновляем локально
    localStorage.setItem("lang", lng)
    dispatch({ type: "language/setLanguage", payload: lng })
    setIsOpenLang(false)
  }

  const handleSelectDropdownTheme = (theme: Theme) => {
    dispatch(setTheme(theme))

    // таймаут что бы выпадающее меню закрывалось исправно после выбора темы
    setTimeout(() => {
      setIsOpenTheme(false)
    }, 300)
  }

  if (!userData) {
    return <div>{t("notAuthorized")}</div>
  }

  return (
    <div className="page profile">
      <img src={theme === "dark" ? profileBgDark : profileBg} alt="Background Profile" className="profile-bg" />

      <div className="profile-data_container">
        <div className="profile__avatar-container">
          <img src={userData.avatar || userIcon} alt="Profile Avatar" className="profile__avatar" />

          <div className="stats-star">
            <span>{(userData as any).rating ?? 5}</span>

            <img src={statsStarWhiteIcon} alt="Stats Star Icon" />
          </div>
        </div>

        <div className="profile__info-container">
          <span className="profile__name">
            {userData.firstName} {userData.lastName ? userData.lastName : ""}
          </span>

          <div className="profile__location">
            <img src={locationGreenIcon} alt="Location Icon" />

            <span>{userData.city || "Istanbul, Turkey"}</span>
          </div>

          <span className="profile__status-profession">
            {userData.about || `${t("freelancer")} ${t("photographer")}`}
          </span>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-actions__button" onClick={() => setIsOpenEditProfile(true)}>
          <img src={penIcon} alt="Pen Icon" />

          <span>{t("edit")}</span>
        </button>

        <button className="profile-actions__button">
          <img src={forwardIcon} alt="Forward Icon" />

          <span>{t("share")}</span>
        </button>
      </div>

      <button className="profile-actions__button" onClick={() => setIsOpenReviews(true)}>
        <img src={likeTagIcon} alt="Like Tag Icon" />

        <span>{t("reviews")}</span>
      </button>

      <MiniWallet />

      <div className="profile__menu">
        <ToggleProfileMode activeMode={activeMode} callback={setActiveMode} isProfile={true} />

        {activeMode === "performer" && (
          <div className="profile-mode__description-container">
            <div className="profile-mode__description">
              <div className="description__title">{t("readyWork")}</div>

              <span>{t("readyWorkDescription")}</span>
            </div>

            <div>
              <label className="toggle-switch-urgent">
                <input type="checkbox" checked={isReady} onChange={() => setIsReady((val) => !val)} />
                <span className="slider" />
              </label>
            </div>
          </div>
        )}

        <div className="profile__options-wrapper">
          {activeMode === "performer" && <div className="dash" />}

          <ProfileBtnItem
            title={t("notifications")}
            icon={notificationIcon}
            onClick={() => setIsOpenNotifications(true)}
          >
            <div className="profile__option-count">0</div>
          </ProfileBtnItem>

          <div className="dash" />

          <ProfileBtnItem
            title={t("theme")}
            icon={themeIcon}
            onClick={() => setIsOpenTheme((val: boolean) => !val)}
            onBlur={() => setIsOpenTheme(false)}
          >
            <div className="profile__option-value">{t(selectedTheme)}</div>

            <ul className={`dropdown-menu ${isOpenTheme ? "visible" : ""}`}>
              {AVAILABLE_THEMES.map((theme) => (
                <li key={theme} onMouseDown={() => handleSelectDropdownTheme(theme)}>
                  {t(theme)}

                  <div className={`option-status ${selectedTheme === theme ? "active" : ""}`} />
                </li>
              ))}
            </ul>
          </ProfileBtnItem>

          <ProfileBtnItem
            title={t("language")}
            icon={globalLangIcon}
            onClick={() => setIsOpenLang((val: boolean) => !val)}
            onBlur={() => setIsOpenLang(false)}
          >
            <div className="profile__option-value">{selectedLang}</div>

            <ul className={`dropdown-menu ${isOpenLang ? "visible" : ""}`}>
              {AVAILABLE_LANGUAGES.map((lng) => (
                <li key={lng} onMouseDown={() => handleSelectDropdownLang(lng)}>
                  {lng}

                  <div className={`option-status ${selectedLang === lng ? "active" : ""}`} />
                </li>
              ))}
            </ul>
          </ProfileBtnItem>
        </div>
      </div>

      <button className="specials_button">{t("logOut")}</button>

      <Navigation />

      <ModalEditProfile isOpenEditProfile={isOpenEditProfile} setIsOpenEditProfile={setIsOpenEditProfile} />

      <ModalReviews isOpenReviews={isOpenReviews} setIsOpenReviews={setIsOpenReviews} />

      <Modal isOpen={isOpenNotifications} onClose={() => setIsOpenNotifications(false)}>
        <TransactionsList />
      </Modal>
    </div>
  )
}

export default Profile
