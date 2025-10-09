import { useNavigate } from 'react-router-dom';
import starsIcon from '../../assets/stars.svg';

const MiniWallet = () => {
  const navigate = useNavigate();

  const handleClickWallet = () => {
    navigate('/wallet');
  };

  return (
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
  );
};

export default MiniWallet;
