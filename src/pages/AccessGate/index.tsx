import logo from '../../assets/logo.svg';
import infoCircleWhite from '../../assets/Info-circle-white.svg';
import OpenTelegramButton from './OpenTelegramButton';

const AccessGate = () => {
  return (
    <div className="page access-gate">
      <img className="access-gate__logo" src={logo} alt="Showpls Logo" />

      <div className="access-gate__container">
        <div className="access-gate__content">
          <button className="access-gate__button-info">
            <img src={infoCircleWhite} alt="Info" />
          </button>

          <p className="access-gate__description">
            You can search for executors anywhere. If you want to earn money,
            just enable executor mode
          </p>

          <OpenTelegramButton />
        </div>

        <footer className="access-gate__footer">
          <div className="access-gate__copyright">@2025 Showpls</div>

          <div className="access-gate__footer__links">
            <a href="/">Terms</a>

            <a href="/">Privacy</a>

            <a href="/">Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AccessGate;
