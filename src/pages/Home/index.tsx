import plusActionBannerIcon from '../../assets/plus-action-banner.svg';
import searchActionBannerIcon from '../../assets/search-action-banner.svg';
import linkIcon from '../../assets/link.svg';
import starsIcon from '../../assets/stars.svg';
import mapPinIcon from '../../assets/map-pin.svg';
import historyIcon from '../../assets/history.svg';
import chatLineIcon from '../../assets/chat-line.svg';
import cameraIcon from '../../assets/camera.svg';
import verifiedCheckIcon from '../../assets/verified-check.svg';
import bluetoothIcon from '../../assets/bluetooth.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../../shared/components/Header';

const Home = () => {
  const navigate = useNavigate();

  // удалить - эта логика только для демонстрации
  const [isRequests, setIsRequests] = useState(true);

  const handleClickOption = (bool: boolean) => {
    setIsRequests(bool);
  };

  const handleClickMapBtn = () => {
    navigate('/discover#map');
  };

  return (
    <div className="page home">
      <Header />

      <div className="home__actions-container">
        <div className="action-banner green">
          <img
            src={plusActionBannerIcon}
            alt="Create Request Icon"
            className="action-banner__icon"
          />

          <div className="action-banner-container">
            <p className="action-banner__header">Create request</p>

            <p className="action-banner__content">
              Post what you need, get it done fast
            </p>
          </div>
        </div>

        <div className="action-banner blue">
          <img
            src={searchActionBannerIcon}
            alt="Create Request Icon"
            className="action-banner__icon"
          />

          <div className="action-banner-container">
            <p className="action-banner__header">Find tasks</p>

            <p className="action-banner__content">
              Discover gigs to earn Stars
            </p>
          </div>
        </div>
      </div>

      <div className="home__wallet">
        <div className="wallet__header">
          <div className="wallet__header__title">
            <img src={linkIcon} alt="Link Icon" className="wallet__link-icon" />

            <span>Wallet</span>
          </div>

          <div className="wallet__stars-status">
            <span className="count-hold-stars">40</span>

            <img
              src={starsIcon}
              alt="Telegram Stars Icon"
              // className="tg-stars-icon-status"
            />

            <span className="stars-status">on hold</span>
          </div>
        </div>

        <div className="content-container">
          <div className="wallet-content">
            <span className="count-stars">120</span>

            <div className="tg-stars-icon__container">
              <img
                src={starsIcon}
                alt="Telegram Stars Icon"
                className="tg-stars-icon"
              />
            </div>

            <span className="wallet-content__aviable">Aviable</span>
          </div>

          <button className="button-switch-map" onClick={handleClickMapBtn}>
            <img src={mapPinIcon} alt="Map Pin Icon" />

            <span>Find Executors on Map</span>
          </button>
        </div>
      </div>

      <div className="home__activity-banner">
        <div className="activity-banner__header">
          <img src={historyIcon} alt="History Icon" />

          <span>Resent Activity</span>
        </div>

        <div className="activity__container">
          <div className="activity__options">
            <button
              className={`option ${isRequests ? 'active' : ''} `}
              onClick={() => handleClickOption(true)}
            >
              Requests
            </button>

            <button
              className={`option ${!isRequests ? 'active' : ''} `}
              onClick={() => handleClickOption(false)}
            >
              Executions
            </button>
          </div>

          <div className="option__content-list">
            <div className="option__content">
              <img src={chatLineIcon} alt="Chat Line Icon" />

              <span>Translate menu from photo</span>

              <div className="task__status">Founded</div>
            </div>

            <div className="option__content">
              <img src={cameraIcon} alt="Chat Line Icon" />

              <span>Take photo of store front</span>

              <div className="task__status accepted">In progress</div>
            </div>

            <div className="option__content">
              <img src={verifiedCheckIcon} alt="Chat Line Icon" />

              <span>Take photo of store front</span>

              <div className="task__status accepted">Delivered</div>
            </div>

            <div className="option__content">
              <img src={bluetoothIcon} alt="Chat Line Icon" />

              <span>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum
                cum ipsa voluptas autem, officiis, laboriosam molestiae a
                aperiam deleniti unde, id inventore molestias facilis aliquam
                illum. Pariatur perspiciatis amet quas?
              </span>

              <div className="task__status accepted">Delivered</div>
            </div>
          </div>
        </div>
      </div>

      <NavigationSkeleton />
    </div>
  );
};

export default Home;
