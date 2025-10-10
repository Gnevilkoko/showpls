import plusActionBannerIcon from '../../assets/plus-action-banner.svg';
import searchActionBannerIcon from '../../assets/search-action-banner.svg';
import starsIcon from '../../assets/stars.svg';
import logoSpecials from '../../assets/logo-specials.png';
import partnerNikeLogo from '../../assets/partnerNikeLogo.png';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../../shared/components/Header';
import MiniWallet from '../../shared/components/MiniWallet';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'missions' | 'on scene'>(
    'missions'
  );

  const { t } = useTranslation();

  const handleClickOption = (val: 'missions' | 'on scene') => {
    setActiveSection(val);
  };

  const handleClickCreateTask = () => {
    navigate('/tasks', { state: { mode: 'createTask' } });
  };

  const handleClickFindTask = () => {
    navigate('/tasks', { state: { mode: 'findTask' } });
  };

  return (
    <div className="page home">
      <Header />

      <div className="home__actions-container">
        <div className="action-banner green" onClick={handleClickCreateTask}>
          <img
            src={plusActionBannerIcon}
            alt="Create Request Icon"
            className="action-banner__icon"
          />

          <div className="action-banner-container">
            <p className="action-banner__header">
              {t('homePage.actions.firstTitle')}
            </p>

            <p className="action-banner__content">
              {t('homePage.actions.firstDescription')}
            </p>
          </div>
        </div>

        <div className="action-banner blue" onClick={handleClickFindTask}>
          <img
            src={searchActionBannerIcon}
            alt="Create Request Icon"
            className="action-banner__icon"
          />

          <div className="action-banner-container">
            <p className="action-banner__header">
              {t('homePage.actions.secondTitle')}
            </p>

            <p className="action-banner__content">
              {t('homePage.actions.secondDescription')}
            </p>
          </div>
        </div>
      </div>

      <MiniWallet />

      <div className="home__specials-banner">
        <div className="specials-banner__header">
          <img
            src={logoSpecials}
            className="default-logo"
            alt="Showpls Specials Logo"
          />
        </div>

        <div className="specials__container">
          <div className="specials__options">
            <button
              className={`specials__option ${
                activeSection === 'missions' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('missions')}
            >
              {t('homePage.options.first')}
            </button>

            <button
              className={`specials__option ${
                activeSection === 'on scene' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('on scene')}
            >
              {t('homePage.options.second')}
            </button>
          </div>

          <div className="option__content-list">
            <div className="option__wrapper">
              <img
                src={partnerNikeLogo}
                alt="Chat Line Icon"
                className="partner-logo"
              />

              <div className="option__content">
                <span>Take photo with Nike shoes</span>

                <span className="option__price">
                  {t('homePage.options.earn', { stars: 50 })}
                  <img src={starsIcon} alt="Telegram Stars Icon" />
                </span>
              </div>

              <button className="option__task-button">
                {t('homePage.options.btnDetails')}
              </button>
            </div>

            <div className="option__wrapper">
              <img
                src={partnerNikeLogo}
                alt="Chat Line Icon"
                className="partner-logo"
              />

              <div className="option__content">
                <span>Film short video drinking Coca-Cola</span>

                <span className="option__price">
                  {t('homePage.options.earn', { stars: 100 })}
                  <img src={starsIcon} alt="Telegram Stars Icon" />
                </span>
              </div>

              <button className="option__task-button">
                {t('homePage.options.btnDetails')}
              </button>
            </div>
          </div>

          <button className="specials_button">{t('homePage.loadMore')}</button>
        </div>
      </div>

      <NavigationSkeleton />
    </div>
  );
};

export default Home;
