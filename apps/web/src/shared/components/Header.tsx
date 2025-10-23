import { useNavigate } from "react-router-dom"
import globalTransIcon from "../../assets/icons/ui/global-translate.svg"
import arrowDownTransIcon from "../../assets/icons/ui/arrow-down-translate.svg"
import logo from "../../assets/images/logo.svg"
import checkIcon from "../../assets/icons/status/check-icon.svg"
import userIcon from "../../assets/icons/navigation/user.svg"
import { useState } from "react"
import { useAppDispatch, useAppSelector } from "../../store"
import { AVAILABLE_LANGUAGES, setLanguage } from "../../store/languageSlice"

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const userData = useAppSelector((state) => state.user.userData)
  const selectedLang = useAppSelector((state) => state.language)

  const [isOpenLang, setIsOpenLang] = useState<boolean>(false)

  const handleClickAvatar = () => {
    navigate("/profile")
  }

  const handleSelectDropdown = (lng: string) => {
    dispatch(setLanguage(lng))
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
        <img src={userData?.photoUrl || userIcon} alt="" className="avatar" />

        <img src={checkIcon} alt="Check Icon" className="avatar__check" />
      </div>
    </div>
  )
}

export default Header
