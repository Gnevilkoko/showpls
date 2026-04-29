import { useTranslation } from "react-i18next"
import ProfileSubPage from "../components/ProfileSubPage"

const ProfilePrivacy = () => {
  const { t } = useTranslation()

  return (
    <ProfileSubPage title={t("privacySecurity")}>
      <div className="profile-screen__text-block">
        {t("profileScreens.privacyText")
          .split("\n")
          .map((line, i) =>
            line.trim() ? (
              <p key={i}>{line}</p>
            ) : null
          )}
        <p>
          <a href="https://showpls.com/privacy.html" target="_blank" rel="noopener noreferrer">
            https://showpls.com/privacy.html
          </a>
        </p>
      </div>
    </ProfileSubPage>
  )
}

export default ProfilePrivacy
