'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, Activity, TrendingUp, Zap, Globe, Settings, X, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<string | string[]>;
    isMetaMask?: boolean;
  };
}


interface ConnectedWallet {
  name: string;
  address: string;
  chainId?: number;
}

interface NodeStats {
  isConnected: boolean;
  totalEarnings: number;
  todayEarnings: number;
  bandwidthUsed: number;
  uptime: number;
  requestCount: number;
  location: string;
  timestamp: number;
}

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (walletName: string) => void;
}

interface StatsCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  value: string;
  change?: number;
  color?: string;
}

interface EarningsDay {
  date: string;
  earnings: number;
  timestamp: number;
}

type WebSocketMessage = 
  | { type: 'stats'; data: NodeStats }
  | { type: 'earnings'; data: EarningsDay[] }
  | { type: 'connection'; data: { isConnected: boolean } };

interface WebSocketHookReturn {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
}


const mockNodeStats: NodeStats = {
  isConnected: true,
  totalEarnings: 24.57,
  todayEarnings: 3.42,
  bandwidthUsed: 156.7,
  uptime: 99.2,
  requestCount: 1247,
  location: "New York, US",
  timestamp: Date.now()
};

const generateMockEarningsHistory = (): EarningsDay[] => {
  const history: EarningsDay[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history.push({
      date: date.toISOString().split('T')[0],
      earnings: Math.random() * 4 + 1,
      timestamp: date.getTime()
    });
  }
  
  return history;
};

const useWebSocket = (url: string): WebSocketHookReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    console.log('Simulating WebSocket connection to:', url);
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      setConnectionStatus('disconnected');
      console.log('WebSocket connection failed (simulated)');
      
      setLastMessage({
        type: 'connection',
        data: { isConnected: false }
      });
    }, 2000);
  }, [url]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setConnectionStatus('disconnected');
  }, [socket]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    console.log('Would send WebSocket message:', message);
  }, []);

  return {
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  };
};

const useWalletConnect = () => {
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
        await new Promise(resolve => setTimeout(resolve, 1500));
        setConnectedWallet({
          name: walletName,
          address: '0x742d35Cc6584C0532A3c82a8d892c55C2C6EDfE9',
          chainId: 1
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

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ isOpen, onClose, onConnect }) => {
  
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

const StatsCard: React.FC<StatsCardProps> = ({ icon: Icon, title, value, change }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-orange-500/30 transition-all">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 rounded-lg bg-orange-500/20">
        <Icon className="w-6 h-6 text-orange-500" />
      </div>
      {change && (
        <span className={`text-sm font-medium ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  </div>
);

const EarningsChart: React.FC<{ data: EarningsDay[] }> = ({ data }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTooltipValue = (value: number): [string, string] => [`${value.toFixed(2)}`, 'Earnings'];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6 text-white">Earnings History (7 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={formatDate}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value: number) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={formatTooltipValue}
              labelFormatter={(value: string) => `Date: ${formatDate(value)}`}
            />
            <Line 
              type="monotone" 
              dataKey="earnings" 
              stroke="#F97316" 
              strokeWidth={3}
              dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#F97316', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function TurboNodeDashboard() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [nodeStats, setNodeStats] = useState<NodeStats>(mockNodeStats);
  const [earningsHistory, setEarningsHistory] = useState<EarningsDay[]>(generateMockEarningsHistory());
  
  const webSocket = useWebSocket('ws://localhost:8766');
  
  const { connectedWallet, isConnecting, connectWallet, disconnectWallet } = useWalletConnect();

  useEffect(() => {
    if (webSocket.lastMessage) {
      const { type, data } = webSocket.lastMessage;
      
      switch (type) {
        case 'stats':
          setNodeStats(prevStats => ({
            ...prevStats,
            ...data,
            timestamp: Date.now()
          }));
          break;
        case 'earnings':
          setEarningsHistory(data);
          break;
        case 'connection':
          setNodeStats(prevStats => ({
            ...prevStats,
            isConnected: data.isConnected
          }));
          break;
      }
    }
  }, [webSocket.lastMessage]);

  useEffect(() => {
    webSocket.connect();
    
    return () => {
      webSocket.disconnect();
    };
  }, [webSocket]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodeStats(prev => ({
        ...prev,
        requestCount: prev.requestCount + Math.floor(Math.random() * 5),
        bandwidthUsed: prev.bandwidthUsed + Math.random() * 0.1,
        todayEarnings: prev.todayEarnings + Math.random() * 0.01,
        timestamp: Date.now()
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleWalletConnect = async (walletName: string) => {
    try {
      await connectWallet(walletName);
      setIsWalletModalOpen(false);
      
      console.log('Would send wallet info to tray client:', {
        wallet: walletName,
        address: connectedWallet?.address
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const getWebSocketStatusIcon = () => {
    switch (webSocket.connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Turbo Node Dashboard</h1>
              <div className="flex items-center gap-2 ml-4">
                {getWebSocketStatusIcon()}
                <span className="text-sm text-gray-400">
                  {webSocket.connectionStatus}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {connectedWallet ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Connected via {connectedWallet.name}</p>
                    <p className="text-sm font-mono">
                      {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="w-3 h-3 bg-green-500 rounded-full hover:bg-red-500 transition-colors"
                    title="Disconnect wallet"
                  ></button>
                </div>
              ) : (
                <button
                  onClick={() => setIsWalletModalOpen(true)}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2"
                >
                  <Wallet size={18} />
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className={`p-4 rounded-xl border ${nodeStats.isConnected 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${nodeStats.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <h3 className="font-medium text-white">
                    Node Status: {nodeStats.isConnected ? 'Online' : 'Offline'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    Location: {nodeStats.location} • Uptime: {nodeStats.uptime}% • Last update: {new Date(nodeStats.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={TrendingUp}
            title="Total Earnings"
            value={`$${nodeStats.totalEarnings.toFixed(2)}`}
            change={12.5}
          />
          <StatsCard
            icon={Zap}
            title="Today's Earnings"
            value={`$${nodeStats.todayEarnings.toFixed(2)}`}
            change={8.3}
          />
          <StatsCard
            icon={Activity}
            title="Bandwidth Used"
            value={`${nodeStats.bandwidthUsed.toFixed(1)} GB`}
            change={5.2}
          />
          <StatsCard
            icon={Globe}
            title="Requests Served"
            value={nodeStats.requestCount.toLocaleString()}
            change={15.7}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EarningsChart data={earningsHistory} />

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white">
                <span>View Detailed Analytics</span>
                <ExternalLink size={18} />
              </button>
              <button 
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 text-white"
                disabled={!connectedWallet}
              >
                <span>Withdraw Earnings</span>
                <ExternalLink size={18} />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white">
                <span>Node Settings</span>
                <Settings size={18} />
              </button>
              <button 
                onClick={() => webSocket.connectionStatus === 'connected' ? webSocket.disconnect() : webSocket.connect()}
                className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all text-white"
              >
                <span>{webSocket.connectionStatus === 'connected' ? 'Disconnect' : 'Connect'} WebSocket</span>
                {getWebSocketStatusIcon()}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Turbo Node Runner • Earn passive income by sharing bandwidth</p>
          <p className="mt-2">
            Using simulated data updates • WebSocket connection simulated
          </p>
        </div>
      </main>

      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />
    </div>
  );
}