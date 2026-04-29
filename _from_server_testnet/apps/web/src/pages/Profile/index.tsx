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
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import MiniWallet from "../../shared/components/MiniWallet"
import ToggleProfileMode from "../../shared/components/ToggleProfileMode"
import { useAppDispatch, useAppSelector } from "../../store"
import { useTranslation } from "react-i18next"
import { AVAILABLE_LANGUAGES } from "../../store/languageSlice"
import {
  useGetMeQuery,
  useGetReviewsQuery,
  useToggleAvailableMutation,
  useUpdateUserLocationMutation,
  useUpdateLanguageMutation,
} from "../../store/api/userApi"
import Navigation from "../../shared/components/Navigation"
import ProfileBtnItem from "./components/ProfileBtnItem"
import { AVAILABLE_THEMES } from "../../constants"
import themeIcon from "../../assets/icons/ui/theme.svg"
import ModalEditProfile from "./components/ModalEditProfile"
import ModalReviews from "./components/ModalReviews"
import { setTheme, type Theme } from "../../store/themeSlice"
import { useSelector } from "react-redux"
import type { RootState } from "../../store"
import { clearAuthData, updateUserPartial } from "../../store/userSlice"
import { useSignOutMutation } from "../../store/api/authApi"
import boxIcon from "../../assets/icons/ui/box.svg"
import verificationShieldIcon from "../../assets/icons/ui/security-safe.svg"
import supportMenuIcon from "../../assets/icons/ui/support.svg"
import messageQuestionIcon from "../../assets/icons/ui/message-question.svg"
import documentTextIcon from "../../assets/icons/ui/document-text.svg"
import { useGetChatListQuery } from "../../store/api/chatApi"
import ModalProfileNotifications from "./components/ModalProfileNotifications"
import ModalPerformerVerification from "./components/ModalPerformerVerification"
import { useNotification } from "../../shared/hooks/useNotification"
import { NotificationHandler } from "../../shared/utils/notificationHandler"
import { requestGeolocationPosition } from "../../shared/utils/performerDeviceProfile"
import { usePerformerReadyGeolocation } from "../../shared/hooks/usePerformerReadyGeolocation"

const Profile = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const theme: Theme = useSelector((state: RootState) => state.theme)
  const dispatch = useAppDispatch()
  const notification = useNotification()
  const [updateLanguage] = useUpdateLanguageMutation()
  const [signOut] = useSignOutMutation()
  const [toggleAvailable, { isLoading: togglingReady }] = useToggleAvailableMutation()
  const [updateUserLocation] = useUpdateUserLocationMutation()

  const [isOpenEditProfile, setIsOpenEditProfile] = useState<boolean>(false)
  const [isOpenReviews, setIsOpenReviews] = useState<boolean>(false)
  const [isOpenNotifications, setIsOpenNotifications] = useState<boolean>(false)
  const [isOpenVerification, setIsOpenVerification] = useState(false)

  const selectedLang = useAppSelector((state) => state.language)
  const selectedTheme = useAppSelector((state) => state.theme)

  const userData = useAppSelector((state) => state.user.userData)
  const { data: profileData } = useGetMeQuery(undefined, { skip: !userData })
  const { data: reviews = [] } = useGetReviewsQuery(undefined, { skip: !userData })
  const { data: chatListData } = useGetChatListQuery({ page: 1, limit: 15 }, { skip: !userData })
  const unreadChats = chatListData?.countUnread ?? 0

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

  const mergedProfile = useMemo(() => {
    if (!userData) return null
    return profileData ? { ...userData, ...profileData } : userData
  }, [userData, profileData])

  const handleReadyToggle = async () => {
    if (!mergedProfile) return
    const nextOn = !Boolean(mergedProfile.isAvailable)
    const verified =
      mergedProfile.performerVerification != null && typeof mergedProfile.performerVerification === "object"
    if (nextOn && !verified) {
      notification.showError("verifyFirstToWork")
      setIsOpenVerification(true)
      return
    }
    try {
      if (nextOn && verified) {
        let pos: GeolocationPosition
        try {
          pos = await requestGeolocationPosition()
        } catch {
          notification.showError("performLocationRequiredForReady")
          return
        }
        try {
          await updateUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }).unwrap()
        } catch (locErr) {
          if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(locErr)) {
            notification.showError("somethingWentWrong")
          }
          return
        }
      }
      const r = await toggleAvailable().unwrap()
      dispatch(updateUserPartial({ isAvailable: r.isAvailable }))
    } catch (e: unknown) {
      const msg = (e as { data?: { message?: string } })?.data?.message
      if (msg === "PERFORMER_VERIFICATION_REQUIRED") {
        notification.showError("verifyFirstToWork")
        setIsOpenVerification(true)
      } else if (msg === "PERFORMER_LOCATION_REQUIRED") {
        notification.showError("performLocationRequiredForReady")
      } else if (!NotificationHandler.wasErrorAlreadyShownByBaseQuery(e)) {
        notification.showError("somethingWentWrong")
      }
    }
  }

  if (!userData || !mergedProfile) {
    return <div>{t("notAuthorized")}</div>
  }

  const profile = mergedProfile
  const isReady = Boolean(mergedProfile.isAvailable)
  const performerVerified =
    mergedProfile.performerVerification != null && typeof mergedProfile.performerVerification === "object"
  const displayRating = (profileData?.rating ?? userData.rating ?? 5).toFixed(1)

  usePerformerReadyGeolocation({
    isAvailable: isReady,
    isVerified: performerVerified,
    userId: profile.id != null ? String(profile.id) : undefined,
  })

  return (
    <div className="page profile">
      <img src={theme === "dark" ? profileBgDark : profileBg} alt="Background Profile" className="profile-bg" />

      <div className="profile-data_container">
        <div className="profile__avatar-container">
          <img src={profile.avatar || userIcon} alt="Profile Avatar" className="profile__avatar" />

          <div className="stats-star">
            <span>{displayRating}</span>

            <img src={statsStarWhiteIcon} alt="Stats Star Icon" />
          </div>
        </div>

        <div className="profile__info-container">
          <span className="profile__name">
            {profile.firstName} {profile.lastName ? profile.lastName : ""}
          </span>

          <div className="profile__location">
            <img src={locationGreenIcon} alt="Location Icon" />

            <span>{profile.city || "Istanbul, Turkey"}</span>
          </div>

          <span className="profile__status-profession">
            {profile.about || `${t("freelancer")} ${t("photographer")}`}
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
              <label className={`toggle-switch-urgent ${!performerVerified && !isReady ? "toggle-switch-urgent--needs-verify" : ""}`}>
                <input
                  type="checkbox"
                  checked={isReady}
                  onChange={handleReadyToggle}
                  disabled={togglingReady}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        )}

        <div className="profile__options-wrapper">
          {activeMode === "performer" && <div className="dash" />}

          <ProfileBtnItem
            title={t("myOrders")}
            icon={boxIcon}
            onClick={() =>
              navigate("/tasks", {
                state: { mode: activeMode === "customer" ? "createTask" : undefined },
              })
            }
          />

          <ProfileBtnItem title={t("verification")} icon={verificationShieldIcon} onClick={() => setIsOpenVerification(true)}>
            {performerVerified ? <div className="profile__option-value">{t("performerVerification.verifiedShort")}</div> : null}
          </ProfileBtnItem>

          <ProfileBtnItem
            title={t("notifications")}
            icon={notificationIcon}
            onClick={() => setIsOpenNotifications(true)}
          >
            {unreadChats > 0 ? <div className="profile__option-count">{unreadChats > 99 ? "99+" : unreadChats}</div> : null}
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

          <ProfileBtnItem title={t("support")} icon={supportMenuIcon} onClick={() => navigate("/chat/support")} />

          <ProfileBtnItem title={t("about")} icon={messageQuestionIcon} onClick={() => window.open("https://showpls.com", "_blank", "noopener,noreferrer")} />

          <div className="dash" />

          <ProfileBtnItem
            title={t("privacySecurity")}
            icon={documentTextIcon}
            onClick={() => window.open("https://showpls.com/privacy.html", "_blank", "noopener,noreferrer")}
          />
        </div>
      </div>

      {userData?.role === "admin" && (
        <Link to="/admin" className="specials_button profile__admin-panel">
          {t("adminPanel.title")}
        </Link>
      )}

      <button
        className="specials_button"
        onClick={() => {
          signOut()
          dispatch(clearAuthData())
        }}
      >
        {t("logOut")}
      </button>

      <Navigation />

      <ModalEditProfile isOpenEditProfile={isOpenEditProfile} setIsOpenEditProfile={setIsOpenEditProfile} />

      <ModalReviews isOpenReviews={isOpenReviews} setIsOpenReviews={setIsOpenReviews} reviews={reviews} />

      <ModalProfileNotifications
        isOpen={isOpenNotifications}
        onClose={() => setIsOpenNotifications(false)}
        unreadCount={unreadChats}
      />

      <ModalPerformerVerification isOpen={isOpenVerification} onClose={() => setIsOpenVerification(false)} />
    </div>
  )
}

export default Profile
