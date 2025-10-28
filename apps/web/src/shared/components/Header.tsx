import { useNavigate } from "react-router-dom"
import globalTransIcon from "../../assets/icons/ui/global-translate.svg"
import arrowDownTransIcon from "../../assets/icons/ui/arrow-down-translate.svg"
import logo from "../../assets/images/logo.svg"
import checkIcon from "../../assets/icons/status/check-icon.svg"
import userIcon from "../../assets/icons/navigation/user.svg"
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "../../store"
import { AVAILABLE_LANGUAGES } from "../../store/languageSlice"
import { useUpdateLanguageMutation } from "../../store/userApi"

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [updateLanguage] = useUpdateLanguageMutation()

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

  return (
    <div className="main-header">
      <img src={logo} alt="Showpls Logo" className="default-logo" />

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

          <img src={arrowDownTransIcon} alt="Arrow Down Icon" className={isOpenLang ? "rotated" : ""} />
        </button>

        <ul className={`translate-dropdown-menu ${isOpenLang ? "visible" : ""}`}>
          {AVAILABLE_LANGUAGES.map((lng) => (
            <li key={lng} onMouseDown={() => handleSelectDropdown(lng)}>
              {lng}

              <div className={`trans-option-status ${selectedLang === lng ? "active" : ""}`} />
            </li>
          ))}
        </ul>
      </div>

      <div className="avatar-container" onClick={handleClickAvatar}>
        <img src={userData?.avatar || userIcon} alt="" className="avatar" />

        <img src={checkIcon} alt="Check Icon" className="avatar__check" />
      </div>
    </div>
  )
}

export default Header
