import { createContext, useContext } from 'react';
import { TonConnectUI } from '@tonconnect/ui-react';

export interface WalletContextProps {
  wallet: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  tonConnectUI: TonConnectUI | null;
}

export const WalletContext = createContext<WalletContextProps | undefined>(
  undefined
);

export const useTonWallet = () => {
  const context = useContext(WalletContext);
  if (!context)
    throw new Error('useTonWallet must be used within TonWalletProvider');
  return context;
};
