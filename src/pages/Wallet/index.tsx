import walletIcon from '../../assets/wallet-new.svg';
import starsIcon from '../../assets/stars.svg';
import lockIcon from '../../assets/lock.svg';
import checkMarkWhiteIcon from '../../assets/check-mark-white.svg';
import lockKeyholeWhiteIcon from '../../assets/lock-keyhole-white.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useTranslation } from 'react-i18next';

type Transaction = {
  id: string;
  type: 'founded' | 'escrowHold' | 'releasedExecutor' | 'refundedCustomer';
  stars?: number;
  status: 'hold' | 'verified';
  isStars: boolean;
  date: string;
};

const transactionList: Transaction[] = [
  {
    id: '1',
    type: 'founded',
    stars: 200,
    status: 'verified',
    isStars: true,
    date: '10 Apr',
  },
  {
    id: '2',
    type: 'escrowHold',
    stars: 120,
    status: 'hold',
    isStars: true,
    date: '9 Apr',
  },
  {
    id: '3',
    type: 'releasedExecutor',
    status: 'verified',
    isStars: false,
    date: '8 Apr',
  },
  {
    id: '4',
    type: 'refundedCustomer',
    status: 'verified',
    isStars: false,
    date: '7 Apr',
  },
  {
    id: '5',
    type: 'founded',
    stars: 200,
    status: 'verified',
    isStars: true,
    date: '6 Apr',
  },
  {
    id: '6',
    type: 'escrowHold',
    stars: 120,
    status: 'hold',
    isStars: true,
    date: '5 Apr',
  },
];

const Wallet = () => {
  const { t } = useTranslation();

  return (
    <div className="page wallet">
      <h1 className="wallet-header">{t('wallet')}</h1>

      <div className="wallet-container">
        <div className="wallet__header">
          <div className="wallet__header__title">
            <img src={walletIcon} alt="Wallet Icon" />

            <span>{t('wallet')}</span>
          </div>

          <div className="wallet__stars-status">
            <span className="count-hold-stars">40</span>

            <img src={starsIcon} alt="Telegram Stars Icon" />

            <span className="stars-status">{t('miniWallet.onHold')}</span>
          </div>
        </div>

        <div className="wallet-content__container">
          <div className="wallet-content__wrapper">
            <span className="wallet-content__available">
              {t('miniWallet.available')}
            </span>

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

          <div className="wallet-content__buttons-container">
            <button className="wallet-content__button green">
              {t('topUp')}
            </button>

            <button className="wallet-content__button blue">
              {t('payout')}
            </button>
          </div>
        </div>
      </div>

      <div className="transaction-container">
        <h2>{t('transHistory')}</h2>

        <div className="wallet-clue">
          <img src={lockIcon} alt="Lock Icon" />

          <span>{t('escrowClue')}</span>
        </div>

        {transactionList.map((item: Transaction) => (
          <div className="transaction_item" key={item.id}>
            <div
              className={`trans-status-icon ${
                item.status === 'verified' ? 'green' : 'gold'
              }`}
            >
              <img
                src={
                  item.status === 'verified'
                    ? checkMarkWhiteIcon
                    : lockKeyholeWhiteIcon
                }
                alt="Check Mark Icon"
              />
            </div>

            <div className="transaction_item-content">
              <span>{t(item.type, { count: item.stars })}</span>

              {item.isStars && (
                <img src={starsIcon} alt="Telegram Stars Icon" />
              )}
            </div>

            <div className="trans-date">{item.date}</div>
          </div>
        ))}
      </div>

      <NavigationSkeleton />
    </div>
  );
};

export default Wallet;
