import background from '../../assets/access-gate-bg.webp';
import logo from '../../assets/logo.svg';
import OpenTelegramButton from './OpenTelegramButton';

const AccessGate = () => {
  return (
    <div className="page access-gate">
      <img
        src={background}
        alt="Background"
        fetchPriority="high"
        className="access-gate__background"
      />

      <img className="access-gate__logo" src={logo} alt="Showpls Logo" />

      <div className="access-gate__container">
        <div className="access-gate__content">
          <h1 className="access-gate__header">Welcome to Showpls!</h1>

          <p className="access-gate__description">
            8.7 billion eye. One Global Workforce
            <br />
            Every smartphone, camera, drone can earn with Showpls
          </p>

          <OpenTelegramButton />
        </div>

        <footer className="access-gate__footer">
          <div className="access-gate__copyright">@2025 Showpls</div>

          <nav className="access-gate__footer__links">
            <a href="/">Terms</a>

            <a href="/">Privacy</a>

            <a href="/">Support</a>
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default AccessGate;
