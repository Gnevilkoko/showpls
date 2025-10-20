import React, { useEffect, useState } from 'react';
import { WalletContext, type WalletContextProps } from './TonWalletContext';
import { useTonConnectUI, type ConnectedWallet } from '@tonconnect/ui-react';

export const TonWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => {
    if (!tonConnectUI) return;

    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      if (walletInfo) {
        setWallet(walletInfo.account.address);
      } else {
        setWallet(null);
      }
    });

    const handleBeforeUnload = () => tonConnectUI.disconnect();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tonConnectUI]);

  const connectWallet = async () => {
    if (!tonConnectUI) return;

    try {
      const walletInfo =
        (await tonConnectUI.openModal()) as unknown as ConnectedWallet;
      if (walletInfo) {
        setWallet(walletInfo.account.address);
      } else {
        setWallet(null);
      }
    } catch (err) {
      alert(`Ошибка подключения кошелька: ${err}`);
      setWallet(null);
    }
  };

  const disconnectWallet = async () => tonConnectUI?.disconnect();

  const value: WalletContextProps = {
    wallet,
    connectWallet,
    disconnectWallet,
    tonConnectUI: tonConnectUI || null,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
