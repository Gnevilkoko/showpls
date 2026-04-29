import { useTranslation } from "react-i18next"
import ProfileSubPage from "../components/ProfileSubPage"

const ProfileAbout = () => {
  const { t } = useTranslation()

  return (
    <ProfileSubPage title={t("about")}>
      <div className="profile-screen__text-block">
        {t("profileScreens.aboutText")
          .split("\n")
          .map((line, i) =>
            line.trim() ? (
              <p key={i}>{line}</p>
            ) : null
          )}
        <p>
          <a href="https://showpls.com" target="_blank" rel="noopener noreferrer">
            showpls.com
          </a>
        </p>
      </div>
    </ProfileSubPage>
  )
}

export default ProfileAbout
