import { useLocation, useNavigate } from 'react-router-dom';
import homeWhiteIcon from '../../assets/home-white.svg';
import homeIcon from '../../assets/home.svg';
import globalWhiteIcon from '../../assets/global-white.svg';
import globalIcon from '../../assets/global.svg';
import walletWhiteIcon from '../../assets/wallet-white.svg';
import walletIcon from '../../assets/wallet.svg';
import userWhiteIcon from '../../assets/user-white.svg';
import userIcon from '../../assets/user.svg';

const Navigation = () => {
  // отслеживаем какая страница сейчас активна
  // на основе этого подменяем иконки и стили
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (patchName: string) => {
    // при нажатии на кнопку - переходим на другую страницу
    if (patchName !== location.pathname) {
      navigate(patchName);
    }
  };

  return (
    <nav className="navigation">
      <button
        className={`nav-button ${
          location.pathname === '/home' ? 'active' : ''
        }`}
        onClick={() => handleClick('/home')}
      >
        <img
          src={location.pathname === '/home' ? homeWhiteIcon : homeIcon}
          alt="Home Icon"
          className="nav-button__icon"
        />

        <span>Home</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/discover' ? 'active' : ''
        }`}
        onClick={() => handleClick('/discover')}
      >
        <img
          src={location.pathname === '/discover' ? globalWhiteIcon : globalIcon}
          alt="Home Icon"
          className="nav-button__icon"
        />

        <span>Discover</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/wallet' ? 'active' : ''
        }`}
        onClick={() => handleClick('/wallet')}
      >
        <img
          src={location.pathname === '/wallet' ? walletWhiteIcon : walletIcon}
          alt="Home Icon"
          className="nav-button__icon"
        />

        <span>Wallet</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/profile' ? 'active' : ''
        }`}
        onClick={() => handleClick('/profile')}
      >
        <img
          src={location.pathname === '/profile' ? userWhiteIcon : userIcon}
          alt="Home Icon"
          className="nav-button__icon"
        />

        <span>Profile</span>
      </button>
    </nav>
  );
};

export default Navigation;
