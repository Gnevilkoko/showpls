import plusActionBannerIcon from "../../assets/icons/actions/plus-action-banner.svg"
import searchActionBannerIcon from "../../assets/icons/actions/search-action-banner.svg"
import starsIcon from "../../assets/icons/status/stars.svg"
// import logoSpecials from "../../assets/images/logo-specials.png"
import newLogoSpecials from "../../assets/images/new-logo-specials.svg"
import partnerNikeLogo from "../../assets/images/partnerNikeLogo.png"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Header from "../../shared/components/Header"
import testnetBannerAnimation from "../../assets/animations/testnet-banner-animation.json"
import { useTranslation } from "react-i18next"
import Lottie from "lottie-react"
import Navigation from "../../shared/components/Navigation"

const Home = () => {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<"missions" | "hotspots">("missions")

  const { t } = useTranslation()

  const handleClickOption = (val: "missions" | "hotspots") => {
    setActiveSection(val)
  }

  const handleClickCreateTask = () => {
    navigate("/tasks", { state: { mode: "createTask" } })
  }

  const handleClickFindTask = () => {
    navigate("/tasks", { state: { mode: "findTask" } })
  }

  return (
    <div className="page home">
      <Header />

      <div className="home__actions-container">
        <div className="action-banner green" onClick={handleClickCreateTask}>
          <img src={plusActionBannerIcon} alt="Create Request Icon" className="action-banner__icon" />

          <div className="action-banner-container">
            <p className="action-banner__header">{t("homePage.actions.firstTitle")}</p>

            <p className="action-banner__content">{t("homePage.actions.firstDescription")}</p>
          </div>
        </div>

        <div className="action-banner blue" onClick={handleClickFindTask}>
          <img src={searchActionBannerIcon} alt="Create Request Icon" className="action-banner__icon" />

          <div className="action-banner-container">
            <p className="action-banner__header">{t("homePage.actions.secondTitle")}</p>

            <p className="action-banner__content">{t("homePage.actions.secondDescription")}</p>
          </div>
        </div>
      </div>

      <div className="home__banner-testnet">
        <Lottie animationData={testnetBannerAnimation} />
      </div>

      <div className="home__specials-banner">
        <div className="specials-banner__header">
          <img src={newLogoSpecials} className="specials-logo" alt="Showpls Specials Logo" />
        </div>

        <div className="specials__container">
          <div className="specials__options">
            <button
              className={`specials__option ${activeSection === "missions" ? "active" : ""} `}
              onClick={() => handleClickOption("missions")}
            >
              {t("homePage.options.first")}
            </button>

            <button
              className={`specials__option ${activeSection === "hotspots" ? "active" : ""} `}
              onClick={() => handleClickOption("hotspots")}
            >
              {t("homePage.options.second")}
            </button>
          </div>

          <div className="option__content-list">
            <div className="option__wrapper">
              <img src={partnerNikeLogo} alt="Chat Line Icon" className="partner-logo" />

              <div className="option__content">
                <span>Take photo with Nike shoes</span>

                <span className="option__price">
                  {t("homePage.options.earn", { stars: 50 })}
                  <img src={starsIcon} alt="Telegram Stars Icon" />
                </span>
              </div>

              <button className="option__task-button">{t("homePage.options.btnDetails")}</button>
            </div>

            <div className="option__wrapper">
              <img src={partnerNikeLogo} alt="Chat Line Icon" className="partner-logo" />

              <div className="option__content">
                <span>Film short video drinking Coca-Cola</span>

                <span className="option__price">
                  {t("homePage.options.earn", { stars: 100 })}
                  <img src={starsIcon} alt="Telegram Stars Icon" />
                </span>
              </div>

              <button className="option__task-button">{t("homePage.options.btnDetails")}</button>
            </div>
          </div>

          <button className="specials_button">{t("homePage.loadMore")}</button>
        </div>
      </div>

      <Navigation />
    </div>
  )
}

export default Home
