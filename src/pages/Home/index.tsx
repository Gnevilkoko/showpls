import plusActionBannerIcon from '../../assets/plus-action-banner.svg';
import searchActionBannerIcon from '../../assets/search-action-banner.svg';
import starsIcon from '../../assets/stars.svg';
import logoSpecials from '../../assets/logo-specials.png';
import partnerNikeLogo from '../../assets/partnerNikeLogo.png';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../../shared/components/Header';

const Home = () => {
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'missions' | 'on scene'>(
    'missions'
  );

  const handleClickOption = (val: 'missions' | 'on scene') => {
    setActiveSection(val);
  };

  const handleClickCreateTask = () => {
    navigate('/tasks', { state: { mode: 'createTask' } });
  };

  const handleClickFindTask = () => {
    navigate('/tasks', { state: { mode: 'findTask' } });
  };

  const handleClickWallet = () => {
    navigate('/wallet');
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
            <p className="action-banner__header">I want to see</p>

            <p className="action-banner__content">Post a reqiest</p>
          </div>
        </div>

        <div className="action-banner blue" onClick={handleClickFindTask}>
          <img
            src={searchActionBannerIcon}
            alt="Create Request Icon"
            className="action-banner__icon"
          />

          <div className="action-banner-container">
            <p className="action-banner__header">I can show</p>

            <p className="action-banner__content">Browse tasks to earn</p>
          </div>
        </div>
      </div>

      <div className="wallet-mini-container" onClick={handleClickWallet}>
        <div className="wallet__header">
          <div className="wallet-content__wrapper">
            <span className="wallet-content__available">Available funds</span>

            <div className="wallet-content">
              <span className="count-stars">120</span>

              <div className="tg-stars-icon__container">
                <img
                  src={starsIcon}
                  alt="Telegram Stars Icon"
                  className="tg-stars-icon"
                />
              </div>
            </div>
          </div>

          <div className="wallet__stars-status">
            <span className="count-hold-stars">40</span>

            <img src={starsIcon} alt="Telegram Stars Icon" />

            <span className="stars-status">on hold</span>
          </div>
        </div>
      </div>

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
              Missions
            </button>

            <button
              className={`specials__option ${
                activeSection === 'on scene' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('on scene')}
            >
              On Scene
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
                  Earn 50
                  <img src={starsIcon} alt="Telegram Stars Icon" />
                </span>
              </div>

              <button className="option__task-button">Details</button>
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
                  Earn 100
                  <img src={starsIcon} alt="Telegram Stars Icon" />
                </span>
              </div>

              <button className="option__task-button">Details</button>
            </div>
          </div>

          <button className="specials_button">Load more</button>
        </div>
      </div>

      <NavigationSkeleton />
    </div>
  );
};

export default Home;
