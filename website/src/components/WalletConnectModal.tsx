import React from 'react';
import { X } from 'lucide-react';
import { WindowWithEthereum } from '../types';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletName: string) => void;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
  
  const wallets = [
    { 
      name: 'MetaMask', 
      icon: '🦊', 
      available: typeof window !== 'undefined' && Boolean((window as WindowWithEthereum).ethereum)
    },
    { name: 'WalletConnect', icon: '🔗', available: true },
    { name: 'Coinbase Wallet', icon: '🟦', available: true },
    { name: 'Trust Wallet', icon: '🛡️', available: true },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Connect Wallet</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => onConnect(wallet.name)}
              disabled={!wallet.available}
              className={`w-full flex items-center gap-3 p-4 border rounded-xl transition-all ${
                wallet.available
                  ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-orange-500/50'
                  : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">{wallet.icon}</span>
              <div className="flex-1 text-left">
                <span className="text-white font-medium block">{wallet.name}</span>
                {!wallet.available && (
                  <span className="text-gray-500 text-xs">Not available</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            By connecting, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};
