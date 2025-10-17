import walletIcon from '../../assets/wallet-new.svg';
import starsIcon from '../../assets/stars.svg';
import lockIcon from '../../assets/lock.svg';
import checkMarkWhiteIcon from '../../assets/check-mark-white.svg';
import lockKeyholeWhiteIcon from '../../assets/lock-keyhole-white.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { tgService } from '../../services/webApp';
import { URL_TOPUP_STARS } from '../../constants';
import TonWalletConnect from './TonWalletConnect';
import type { TransactionType } from '../../shared/types';

const transactionList: TransactionType[] = [
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
  const [isOpenModalTopUp, setIsOpenModalTopUp] = useState(false);
  const [activeSection, setActiveSection] = useState<'stars' | 'ton'>('stars');
  const [stars, setStars] = useState<number>(1);

  const handleClickOption = (val: 'stars' | 'ton') => {
    setActiveSection(val);
  };

  const handleClickTopUp = () => {
    setIsOpenModalTopUp(true);
  };

  const handleTopUpStars = async () => {
    const webApp = tgService.webApp;

    if (!webApp) {
      return;
    }

    const res = await fetch(URL_TOPUP_STARS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars }),
    });
    const data = await res.json();

    // Открываем окно оплаты
    webApp.openInvoice(data.invoiceUrl, (status) => {
      switch (status) {
        case 'paid':
          webApp.showAlert('Оплата успешно завершена!');
          setIsOpenModalTopUp(false);
          break;
        case 'cancelled':
          webApp.showAlert('Оплата была отменена.');
          break;
        case 'failed':
        default:
          webApp.showAlert('Ошибка при оплате. Попробуйте ещё раз.');
          break;
      }
    });
  };

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
            <button
              className="wallet-content__button green"
              onClick={handleClickTopUp}
            >
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

        {transactionList.map((item: TransactionType) => (
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

      <div
        className={`modal-top-up__wrapper ${isOpenModalTopUp ? 'active' : ''}`}
        onClick={() => setIsOpenModalTopUp(false)}
      >
        <div className="modal-top-up" onClick={(e) => e.stopPropagation()}>
          <h2 className="wallet-header">{t('topUp')}</h2>

          <div className="specials__options">
            <button
              className={`specials__option ${
                activeSection === 'stars' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('stars')}
            >
              Stars
            </button>

            <button
              className={`specials__option ${
                activeSection === 'ton' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('ton')}
            >
              TON Wallet
            </button>
          </div>

          {activeSection === 'stars' && (
            <>
              <input
                type="number"
                value={stars}
                onChange={(e) => {
                  let val = Number(e.target.value);

                  if (isNaN(val) || val < 1) val = 1;
                  if (val > 10000) val = 10000;

                  setStars(val);
                }}
                inputMode="numeric" // открывает цифровую клавиатуру на мобилках
                placeholder={t('tasksPage.budgetPlaceholder')}
                className="budget-input"
              />

              <button
                className="wallet-content__button green"
                onClick={handleTopUpStars}
              >
                {t('topUpStars')}
              </button>
            </>
          )}

          {activeSection === 'ton' && <TonWalletConnect />}
        </div>
      </div>

      <NavigationSkeleton />
    </div>
  );
};

export default Wallet;
