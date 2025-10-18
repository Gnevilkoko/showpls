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
import { useEffect, useState } from 'react';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // локальное состояние для плавного включения active после загрузки страницы
  const [activePath, setActivePath] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActivePath(location.pathname);
    }, 0); // 0 мс задержка что бы отработала анимация появления активной кнопки

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClick = (pathName: string) => {
    if (pathName !== location.pathname) {
      navigate(pathName);
    }
  };

  return (
    <nav className="navigation">
      <button
        className={`nav-button ${activePath === '/home' ? 'active' : ''}`}
        onClick={() => handleClick('/home')}
      >
        <img
          src={activePath === '/home' ? homeWhiteIcon : homeIcon}
          alt="Home Icon"
          className="nav-button__icon"
        />
        <span>{t('home')}</span>
      </button>

      <button
        className={`nav-button ${activePath === '/tasks' ? 'active' : ''}`}
        onClick={() => handleClick('/tasks')}
      >
        <img
          src={activePath === '/tasks' ? globalWhiteIcon : globalIcon}
          alt="Tasks Icon"
          className="nav-button__icon"
        />
        <span>{t('tasks')}</span>
      </button>

      <button
        className={`nav-button ${activePath === '/chats' ? 'active' : ''}`}
        onClick={() => handleClick('/chats')}
      >
        <img
          src={activePath === '/chats' ? chatsWhiteIcon : chatsIcon}
          alt="Chats Icon"
          className="nav-button__icon"
        />
        <span>{t('chats')}</span>
      </button>

      <button
        className={`nav-button ${activePath === '/wallet' ? 'active' : ''}`}
        onClick={() => handleClick('/wallet')}
      >
        <img
          src={activePath === '/wallet' ? walletWhiteIcon : walletIcon}
          alt="Wallet Icon"
          className="nav-button__icon"
        />
        <span>{t('wallet')}</span>
      </button>

      <button
        className={`nav-button ${activePath === '/profile' ? 'active' : ''}`}
        onClick={() => handleClick('/profile')}
      >
        <img
          src={activePath === '/profile' ? userWhiteIcon : userIcon}
          alt="Profile Icon"
          className="nav-button__icon"
        />
        <span>{t('profile')}</span>
      </button>
    </nav>
  );
};

export default Navigation;
