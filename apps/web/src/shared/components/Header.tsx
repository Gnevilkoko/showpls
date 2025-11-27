import { useNavigate } from "react-router-dom"
import globalTransIcon from "../../assets/icons/ui/global-lang.svg"
// import logoWithoutIcon from "../../assets/images/logo-without-icon.svg"
import newMainLogo from "../../assets/images/new-main-logo.svg"
import checkIcon from "../../assets/icons/status/check-icon.svg"
import userIcon from "../../assets/icons/navigation/user.svg"
import { useState } from "react"
import { useAppDispatch, useAppSelector, type RootState } from "../../store"
import { AVAILABLE_LANGUAGES } from "../../store/languageSlice"
import { useUpdateLanguageMutation } from "../../store/userApi"
import themeIcon from "../../assets/icons/ui/theme.svg"
import { useSelector } from "react-redux"
import { setTheme, type Theme } from "../../store/themeSlice"

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [updateLanguage] = useUpdateLanguageMutation()
  const theme: Theme = useSelector((state: RootState) => state.theme)

  const userData = useAppSelector((state) => state.user.userData)
  const selectedLang = useAppSelector((state) => state.language)

  const [isOpenLang, setIsOpenLang] = useState<boolean>(false)

  const handleClickAvatar = () => {
    navigate("/profile")
  }

  const handleSelectDropdown = async (lng: string) => {
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

  const handleToggleTheme = () => {
    if (theme === "light") {
      dispatch(setTheme("dark"))
    } else {
      dispatch(setTheme("light"))
    }
  }

  return (
    <div className="main-header">
      {/* <img src={logo} alt="Showpls Logo" className="default-logo" /> */}
      <img src={newMainLogo} alt="Showpls Logo" className="default-logo" />

      <div className="header-content">
        <button className="theme-toggle" onClick={handleToggleTheme}>
          <img src={themeIcon} alt="Theme Icon" />
        </button>

        <div className="header__dropdown-wrapper">
          <button
            className="translate-dropdown"
            onClick={() => setIsOpenLang((val: boolean) => !val)}
            onBlur={() => setIsOpenLang(false)}
          >
            <div className="translate-dropdown__content">
              <img src={globalTransIcon} alt="Global Icon" />

              <span>{selectedLang}</span>
            </div>

            <svg className={isOpenLang ? "rotated" : ""} width="12" height="8" viewBox="0 0 12 8" fill="none">
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <ul className={`dropdown-menu ${isOpenLang ? "visible" : ""}`}>
            {AVAILABLE_LANGUAGES.map((lng) => (
              <li key={lng} onMouseDown={() => handleSelectDropdown(lng)}>
                {lng}

                <div className={`option-status ${selectedLang === lng ? "active" : ""}`} />
              </li>
            ))}
          </ul>
        </div>

        <div className="avatar-container" onClick={handleClickAvatar}>
          <img src={userData?.avatar || userIcon} alt="" className="avatar" />

          <img src={checkIcon} alt="Check Icon" className="avatar__check" />
        </div>
      </div>
    </div>
  )
}

export default Header
