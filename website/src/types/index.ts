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

export interface SupabaseHookReturn {
  insertData: (table: string, data: Record<string, any>) => Promise<any>;
  fetchData: (table: string, query?: QueryOptions) => Promise<any>;
  updateData: (table: string, id: string, updates: Record<string, any>) => Promise<any>;
  deleteData: (table: string, id: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export interface QueryOptions {
  eq?: Record<string, any>;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}
