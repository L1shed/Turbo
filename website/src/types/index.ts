// User interface for dashboard display
export interface UserStats {
  id: string;
  email: string;
  username?: string;
  totalEarnings: number; // Converted from Decimal to number for display
  todayEarnings: number; // Converted from Decimal to number for display
  createdAt: Date;
  nodes: NodeStats[];
}

// Node interface matching Prisma schema
export interface NodeStats {
  id: string;
  isActive: boolean;
  dailyEarnings: Record<string, number>; // JSON structure: { "2024-01-15": 25.50, ... }
  bandwidthUsed?: number; // Float in GB
  uptimeMinutes?: number; // Uptime in minutes
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // Additional computed properties for UI
  isConnected?: boolean; // Computed based on recent activity
  location?: string; // May come from external API
  requestCount?: number; // May be computed or come from external source
}

export interface EarningsDay {
  date: string; // Format: "YYYY-MM-DD"
  earnings: number;
}
