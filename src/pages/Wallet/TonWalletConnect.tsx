import { useTonConnectUI } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TonWalletConnect = () => {
  const { t } = useTranslation();
  const [tonConnectUI] = useTonConnectUI();
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      if (walletInfo) {
        setWallet(walletInfo.account.address);
        // alert(`✅ Подключен кошелёк: ${JSON.stringify(walletInfo)}`);
      } else {
        setWallet(null);
        // alert('❌ Кошелёк отключен');
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  const connectWallet = async () => {
    await tonConnectUI.connectWallet();
  };

  const disconnectWallet = async () => {
    await tonConnectUI.disconnect();
  };

  return (
    <>
      {wallet ? (
        <>
          <div className="text-sm break-all">
            Подключено: <b>{wallet}</b>
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
