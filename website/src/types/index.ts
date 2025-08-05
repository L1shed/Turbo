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
