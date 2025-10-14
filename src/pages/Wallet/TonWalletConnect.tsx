import { useTranslation } from 'react-i18next';
import { useTonWallet } from '../../shared/providers/TonWalletContext';

const TonWalletConnect = () => {
  const { t } = useTranslation();
  const { wallet, connectWallet, disconnectWallet } = useTonWallet();

  return (
    <>
      {wallet ? (
        <>
          <div style={{ width: '100%', wordBreak: 'break-all' }}>
            Ваш кошелек: <b>{wallet}</b>
          </div>

          <button className="wallet-content__button green">
            {t('topUpTON')}
          </button>

          <button
            className="wallet-content__button blue"
            onClick={disconnectWallet}
          >
            {t('disconnectWallet')}
          </button>
        </>
      ) : (
        <button className="wallet-content__button blue" onClick={connectWallet}>
          {t('connectWallet')}
        </button>
      )}
    </>
  );
};

export default TonWalletConnect;
