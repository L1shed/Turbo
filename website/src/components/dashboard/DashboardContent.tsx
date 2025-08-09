import React from 'react';
import { Coins, TrendingUp, Activity, Zap } from 'lucide-react';
import { EarningsChart } from './EarningsChart';
import { StatsCard } from './StatsCard';
import { NodeStatus } from './NodeStatus';
import { NodeStats, EarningsDay } from '@/types';

interface DashboardContentProps {
  nodeStats: NodeStats | null;
  earningsHistory: EarningsDay[];
  loading: boolean;
  error: string | null;
  supabaseConnected: boolean;
}

export function DashboardContent({ 
  nodeStats, 
  earningsHistory,
  error,
  supabaseConnected 
}: DashboardContentProps) {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="flex-1 p-6 h-full overflow-hidden">
      {/* Grid Layout: Left side for chart and stats, Right side for node status */}
      <div className="grid grid-cols-12 gap-6 h-full">

        {/* Left Column - Node Status */}
        <div className="col-span-3 flex flex-col ">
          {/* Additional stats at the top of right column */}
          <div className="mb-6">
            <StatsCard
              icon={Coins}
              title="Total Earnings"
              value={formatCurrency(nodeStats?.totalEarnings || 0)}
            />
          </div>

          {/* Node Status Component */}
          <div className="flex-1">
            <NodeStatus 
              nodeStats={nodeStats} 
              isConnected={supabaseConnected && !!nodeStats} 
            />
          </div>
        </div>
        
        {/* Right Column - Stats and Chart */}
        <div className="col-span-9 flex flex-col gap-6 h-full">
          
          {/* Stats Cards Row */}
          <div className="grid grid-cols-3 gap-6">
            <StatsCard
              icon={TrendingUp}
              title="Today's Earnings"
              value={formatCurrency(nodeStats?.todayEarnings || 0)}
            />
            <StatsCard
              icon={Activity}
              title="Bandwidth Used"
              value={formatBytes(nodeStats?.bandwidthUsed || 0)}
            />
            <StatsCard
              icon={Zap}
              title="Requests Served"
              value={(nodeStats?.requestCount || 0).toLocaleString()}
            />
          </div>

          {/* Earnings Chart - Takes remaining space */}
          <div className="flex-1 min-h-0">
            <div className="h-full">
              <EarningsChart data={earningsHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-900 border border-red-700 text-red-100 px-4 py-2 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
