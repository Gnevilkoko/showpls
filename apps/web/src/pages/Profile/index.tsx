import profileBg from "../../assets/images/profile-bg.webp"
import userIcon from "../../assets/icons/navigation/user.svg"
import locationGreenIcon from "../../assets/icons/ui/location-green.svg"
import statsStarWhiteIcon from "../../assets/icons/status/stats-star-white.svg"
import penIcon from "../../assets/icons/actions/pen.svg"
import forwardIcon from "../../assets/icons/ui/forward.svg"
import likeTagIcon from "../../assets/icons/ui/like-tag.svg"
import walletIcon from "../../assets/images/wallet-new.svg"
import boxIcon from "../../assets/icons/ui/box.svg"
import securitySafeIcon from "../../assets/icons/ui/security-safe.svg"
import notificationIcon from "../../assets/icons/status/notification.svg"
import globalLangIcon from "../../assets/icons/ui/global-lang.svg"
import supportIcon from "../../assets/icons/ui/support.svg"
import documentTextIcon from "../../assets/icons/ui/document-text.svg"
import messageQuestionIcon from "../../assets/icons/ui/message-question.svg"
import arrowRightIcon from "../../assets/icons/ui/arrow-right-white.svg"
import { useEffect, useState } from "react"
import MiniWallet from "../../shared/components/MiniWallet"
import ToggleProfileMode from "../../shared/components/ToggleProfileMode"
import { useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "../../store"
import { useTranslation } from "react-i18next"
import { AVAILABLE_LANGUAGES, setLanguage } from "../../store/languageSlice"
import type { TgUserType } from "../../shared/types"
import Navigation from "../../shared/components/Navigation"

const userTest: TgUserType = {
  id: 1111111,
  first_name: "Test User",
}

const Profile = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const selectedLang = useAppSelector((state) => state.language)

  const isDev = import.meta.env.MODE === "development"

  const tgUser = useAppSelector((state) => state.user.tgData)
  const [user, setUser] = useState(isDev ? userTest : tgUser)

  useEffect(() => {
    if (tgUser) setUser(tgUser)
  }, [tgUser])

  const [isReady, setIsReady] = useState(true)
  const [isOpenLang, setIsOpenLang] = useState<boolean>(false)

  const [activeMode, setActiveMode] = useState<"customer" | "performer">("performer")

  const handleSelectDropdown = (lng: string) => {
    dispatch(setLanguage(lng))
    setIsOpenLang(false)
  }

  if (!user) {
    return <div>Вы не авторизованы</div>
  }

  return (
    <div className="page profile">
      <img src={profileBg} alt="Background Profile" className="profile-bg" />

      <div className="profile-data_container">
        <div className="profile__avatar-container">
          <img src={user.photo_url || userIcon} alt="Profile Avatar" className="profile__avatar" />

          <div className="stats-star">
            <span>4.8</span>

            <img src={statsStarWhiteIcon} alt="Stats Star Icon" />
          </div>
        </div>

        <div className="profile__info-container">
          <span className="profile__name">
            {user.first_name} {user.last_name ? user.last_name : ""}
          </span>

          <div className="profile__location">
            <img src={locationGreenIcon} alt="Location Icon" />

            <span>Istanbul, Turkey</span>
          </div>

          <span className="profile__status-profession">
            {t("freelancer")} {t("photographer")}
          </span>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-actions__button">
          <img src={penIcon} alt="Pen Icon" />

          <span>{t("edit")}</span>
        </button>

        <button className="profile-actions__button">
          <img src={forwardIcon} alt="Forward Icon" />

          <span>{t("share")}</span>
        </button>
      </div>

      <button className="profile-actions__button">
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
          <div className="dash" />

          <button className="profile__option" onClick={() => navigate("/wallet")}>
            <div className="profile__option-content">
              <img src={walletIcon} alt="Wallet Icon" />

              <span>{t("wallet")}</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <button className="profile__option">
            <div className="profile__option-content">
              <img src={boxIcon} alt="Box Icon" />

              <span>{t("myOrders")}</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <button className="profile__option">
            <div className="profile__option-content">
              <img src={securitySafeIcon} alt="Security Safe Icon" />

              <span>{t("verification")}</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <button className="profile__option">
            <div className="profile__option-content">
              <img src={notificationIcon} alt="Security Safe Icon" />

              <span>{t("notitfications")}</span>
            </div>

            <div className="profile__option-count">2</div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <div className="dash" />

          <button
            className="profile__option"
            onClick={() => setIsOpenLang((val: boolean) => !val)}
            onBlur={() => setIsOpenLang(false)}
          >
            <div className="profile__option-content">
              <img src={globalLangIcon} alt="Global Lang Icon" />

              <span>{t("language")}</span>
            </div>

            <div className="profile__option-value">{selectedLang}</div>

            <ul className={`translate-dropdown-menu ${isOpenLang ? "visible" : ""}`}>
              {AVAILABLE_LANGUAGES.map((lng) => (
                <li key={lng} onMouseDown={() => handleSelectDropdown(lng)}>
                  {lng}

                  <div className={`trans-option-status ${selectedLang === lng ? "active" : ""}`} />
                </li>
              ))}
            </ul>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <button className="profile__option">
            <div className="profile__option-content">
              <img src={supportIcon} alt="Support Icon" />

              <span>{t("support")}</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <button className="profile__option">
            <div className="profile__option-content">
              <img src={messageQuestionIcon} alt="Support Icon" />

              <span>{t("about")}</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>

          <div className="dash" />

          <button className="profile__option">
            <div className="profile__option-content">
              <img src={documentTextIcon} alt="Support Icon" />

              <span>{t("privacySecurity")}</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </button>
        </div>
      </div>

      <button className="specials_button">{t("logOut")}</button>

      <Navigation />
    </div>
  )
}

export default Profile
