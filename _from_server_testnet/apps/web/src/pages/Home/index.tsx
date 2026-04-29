import plusActionBannerIcon from "../../assets/icons/actions/plus-action-banner.svg"
import searchActionBannerIcon from "../../assets/icons/actions/search-action-banner.svg"
import newLogoSpecials from "../../assets/images/new-logo-specials.svg"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import Header from "../../shared/components/Header"
import testnetBannerAnimation from "../../assets/animations/testnet-banner-animation.json"
import { useTranslation } from "react-i18next"
import Lottie from "lottie-react"
import Navigation from "../../shared/components/Navigation"
import Modal from "../../shared/components/Modal"
import { useAppSelector } from "../../store"
import { useGetSpecialQuery, useGetSpecialsQuery } from "../../store/api/specialsApi"
import type { LocalizedText, SpecialActionType, SpecialSection } from "../../shared/types/backend"

const SPECIALS_PAGE_SIZE = 2

const Home = () => {
  const navigate = useNavigate()

  const [activeSection, setActiveSection] = useState<SpecialSection>("missions")
  const [selectedSpecialId, setSelectedSpecialId] = useState<string | null>(null)
  const [visibleCounts, setVisibleCounts] = useState<Record<SpecialSection, number>>({
    missions: SPECIALS_PAGE_SIZE,
    hotspots: SPECIALS_PAGE_SIZE,
  })

  const { t } = useTranslation()
  const language = useAppSelector((state) => state.language)

  const currentLimit = visibleCounts[activeSection]
  const { data: specialsResponse, isLoading: isLoadingSpecials } = useGetSpecialsQuery({
    section: activeSection,
    limit: currentLimit,
    offset: 0,
  })
  const { data: selectedSpecialData, isFetching: isFetchingSpecial } = useGetSpecialQuery(selectedSpecialId ?? "", {
    skip: !selectedSpecialId,
  })

  const specials = specialsResponse?.items ?? []
  const selectedSpecial = selectedSpecialData ?? specials.find((special) => special.id === selectedSpecialId) ?? null
  const canLoadMore = (specialsResponse?.total ?? 0) > currentLimit

  const handleClickOption = (val: SpecialSection) => {
    setActiveSection(val)
  }

  const handleClickCreateTask = () => {
    navigate("/tasks", { state: { mode: "createTask" } })
  }

  const handleClickFindTask = () => {
    navigate("/tasks", { state: { mode: "findTask" } })
  }

  const handleSpecialAction = (action: SpecialActionType, payload: Record<string, unknown> | null) => {
    if (action === "createTask") {
      navigate("/tasks", { state: { mode: payload?.mode === "createTask" ? "createTask" : "createTask" } })
      return
    }

    if (action === "wallet") {
      navigate("/wallet")
      return
    }

    if (action === "profile") {
      navigate("/profile")
      return
    }

    navigate("/tasks", { state: { mode: payload?.mode === "createTask" ? "createTask" : "findTask" } })
  }

  const getLocalizedText = (value: LocalizedText) => (language === "ru" ? value.ru : value.en)

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

          {isLoadingSpecials && specials.length === 0 ? (
            <div className="specials__empty-state">
              <p>{t("loading")}</p>
            </div>
          ) : specials.length > 0 ? (
            <div className="option__content-list">
              {specials.map((special) => (
                <div className="option__wrapper" key={special.id}>
                  <div className="option__main" onClick={() => setSelectedSpecialId(special.id)}>
                    <div className="partner-logo" style={{ backgroundColor: special.partnerColor }}>
                      <span>{special.partnerShort}</span>
                    </div>

                    <div className="option__content">
                      <div className="option__content-top">
                        <span className="option__partner-name">{special.partnerName}</span>
                        {special.badge ? <span className="option__badge">{getLocalizedText(special.badge)}</span> : null}
                      </div>

                      <span>{getLocalizedText(special.title)}</span>

                      <span className="option__price">
                        {t("homePage.options.earn", { stars: `${special.rewardAmount} ${special.rewardCurrencyCode}` })}
                      </span>
                    </div>
                  </div>

                  <div className="option__actions">
                    <button className="option__task-button" onClick={() => setSelectedSpecialId(special.id)}>
                      {t("homePage.options.btnDetails")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="specials__empty-state">
              <p>{t("homePage.specials.empty")}</p>
            </div>
          )}

          {canLoadMore ? (
            <button
              className="specials_button"
              onClick={() =>
                setVisibleCounts((prev) => ({
                  ...prev,
                  [activeSection]: prev[activeSection] + SPECIALS_PAGE_SIZE,
                }))
              }
            >
              {t("homePage.loadMore")}
            </button>
          ) : null}
        </div>
      </div>

      <Navigation />

      <Modal isOpen={Boolean(selectedSpecialId)} onClose={() => setSelectedSpecialId(null)}>
        {selectedSpecial ? (
          <div className="specials-details">
            <div className="specials-details__header">
              <div className="partner-logo large" style={{ backgroundColor: selectedSpecial.partnerColor }}>
                <span>{selectedSpecial.partnerShort}</span>
              </div>

              <div className="specials-details__header-content">
                <span className="specials-details__partner">{selectedSpecial.partnerName}</span>
                <h2>{getLocalizedText(selectedSpecial.title)}</h2>
                <span className="option__price">
                  {t("homePage.options.earn", {
                    stars: `${selectedSpecial.rewardAmount} ${selectedSpecial.rewardCurrencyCode}`,
                  })}
                </span>
              </div>
            </div>

            <div className="specials-details__section">
              <span className="specials-details__section-title">{t("homePage.specials.summary")}</span>
              <p>{getLocalizedText(selectedSpecial.description)}</p>
            </div>

            <div className="specials-details__section">
              <span className="specials-details__section-title">{t("homePage.specials.steps")}</span>
              <div className="specials-details__steps">
                {selectedSpecial.steps.map((step, index) => (
                  <div className="specials-details__step" key={`${selectedSpecial.id}-${index}`}>
                    <span className="specials-details__step-index">{index + 1}</span>
                    <span>{getLocalizedText(step)}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="specials-details__link-button"
              onClick={() => {
                handleSpecialAction(selectedSpecial.actionType, selectedSpecial.actionPayload)
                setSelectedSpecialId(null)
              }}
            >
              {getLocalizedText(selectedSpecial.actionLabel)}
            </button>
          </div>
        ) : isFetchingSpecial ? (
          <div className="specials__empty-state">
            <p>{t("loading")}</p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default Home
