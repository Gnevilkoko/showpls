import { useLocation, useNavigate } from 'react-router-dom';
import homeWhiteIcon from '../../assets/home-white.svg';
import homeIcon from '../../assets/home.svg';
import globalWhiteIcon from '../../assets/global-white.svg';
import globalIcon from '../../assets/global.svg';
import chatsWhiteIcon from '../../assets/chats-white.svg';
import chatsIcon from '../../assets/chats.svg';
import walletWhiteIcon from '../../assets/wallet-white.svg';
import walletIcon from '../../assets/wallet.svg';
import userWhiteIcon from '../../assets/user-white.svg';
import userIcon from '../../assets/user.svg';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
  // отслеживаем какая страница сейчас активна
  // на основе этого подменяем иконки и стили
  const location = useLocation();
  const navigate = useNavigate();

  const { t } = useTranslation();

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

        <span>{t('home')}</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/tasks' ? 'active' : ''
        }`}
        onClick={() => handleClick('/tasks')}
      >
        <img
          src={location.pathname === '/tasks' ? globalWhiteIcon : globalIcon}
          alt="Discover Icon"
          className="nav-button__icon"
        />

        <span>{t('tasks')}</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/chats' ? 'active' : ''
        }`}
        onClick={() => handleClick('/chats')}
      >
        <img
          src={location.pathname === '/chats' ? chatsWhiteIcon : chatsIcon}
          alt="Chats Icon"
          className="nav-button__icon"
        />

        <span>{t('chats')}</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/wallet' ? 'active' : ''
        }`}
        onClick={() => handleClick('/wallet')}
      >
        <img
          src={location.pathname === '/wallet' ? walletWhiteIcon : walletIcon}
          alt="Wallet Icon"
          className="nav-button__icon"
        />

        <span>{t('wallet')}</span>
      </button>

      <button
        className={`nav-button ${
          location.pathname === '/profile' ? 'active' : ''
        }`}
        onClick={() => handleClick('/profile')}
      >
        <img
          src={location.pathname === '/profile' ? userWhiteIcon : userIcon}
          alt="Profile Icon"
          className="nav-button__icon"
        />

        <span>{t('profile')}</span>
      </button>
    </nav>
  );
};

export default Navigation;
