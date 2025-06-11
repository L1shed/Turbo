export interface Log {
  id: number;
  message: string;
  createdAt: string;
}
export interface WindowWithEthereum extends Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<string | string[]>;
    isMetaMask?: boolean;
  };
}

export interface ConnectedWallet {
  name: string;
  address: string;
  chainId?: number;
}

export interface NodeStats {
  isConnected: boolean;
  totalEarnings: number;
  todayEarnings: number;
  bandwidthUsed: number;
  uptime: number;
  requestCount: number;
  location: string;
  timestamp: number;
}

export interface EarningsDay {
  date: string;
  earnings: number;
  timestamp: number;
}

export type WebSocketMessage =
  | { type: 'stats'; data: NodeStats }
  | { type: 'earnings'; data: EarningsDay[] }
  | { type: 'connection'; data: { isConnected: boolean } };
