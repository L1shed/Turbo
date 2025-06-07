import { useState, useCallback } from 'react';
import { ConnectedWallet, WindowWithEthereum } from '../types';

export const useWalletConnect = () => {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async (walletName: string) => {
    setIsConnecting(true);
    
    try {
      if (walletName === 'MetaMask') {
        const windowWithEthereum = window as WindowWithEthereum;
        if (typeof window !== 'undefined' && windowWithEthereum.ethereum) {
          try {
            const accounts = await windowWithEthereum.ethereum.request({
              method: 'eth_requestAccounts'
            }) as string[];
            
            const chainId = await windowWithEthereum.ethereum.request({
              method: 'eth_chainId'
            }) as string;
            
            setConnectedWallet({
              name: walletName,
              address: accounts[0],
              chainId: parseInt(chainId, 16)
            });
          } catch (error) {
            console.error('MetaMask connection failed:', error);
            throw error;
          }
        } else {
          throw new Error('MetaMask not installed');
        }
      } else {
        // Simulate connection for other wallets
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConnectedWallet({
          name: walletName,
          address: '0x742d35Cc6584C0532A3c82a8d892c55C2C6EDfE9', // Example address
          chainId: 1 // Example chainId
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setConnectedWallet(null);
  }, []);

  return {
    connectedWallet,
    isConnecting,
    connectWallet,
    disconnectWallet
  };
};
